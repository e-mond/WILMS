import { eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { BORROWER_STATUS } from '@wilms/shared-contracts';
import {
  getAdminFee,
  getBorrower,
  hasAdminFee,
  listAdminFees,
  listApprovedBorrowersWithoutAdminFee,
  listBorrowers,
  saveAdminFee,
} from '../../db/persistence.js';
import * as memory from '../../db/store.js';
import { isDatabaseEnabled } from '../../db/client.js';
import { getSettings } from '../settings/service.js';
import * as userRepo from '../../repositories/user.repository.js';
import { notifyAdminFeeRecorded } from '../../infrastructure/notifications/admin-fee-notifications.js';
import { runWithIdempotency } from '../../infrastructure/idempotency/run-with-idempotency.js';
import * as loanRepo from '../../repositories/loan.repository.js';
import { formatLoanDisplayId } from '@wilms/shared-utils';

export interface FinancialTransaction {
  id: string;
  type: 'DISBURSEMENT' | 'REPAYMENT' | 'ADMIN_FEE' | 'WITHDRAWAL' | 'ADJUSTMENT';
  borrowerId: string;
  loanId?: string;
  amountPesewas: number;
  collectorId: string;
  recordedAt: string;
}

export interface AdminFeeStatus {
  borrowerId: string;
  borrowerName: string;
  requiredAmountPesewas: number;
  isPaid: boolean;
  paidAt?: string;
  recordedByCollectorId?: string;
  recordedByCollectorName?: string;
  transactionId?: string;
}

export interface AwaitingAdminFeeBorrower {
  id: string;
  fullName: string;
  phone: string;
  community: string;
  groupName: string;
  requiredAmountPesewas: number;
}

export interface CollectedAdminFeeRecord {
  borrowerId: string;
  borrowerName: string;
  phone: string;
  community: string;
  groupName: string;
  amountPesewas: number;
  collectorId: string;
  collectorName?: string;
  transactionId: string;
  recordedAt: string;
}

function assertApprovedBorrower(borrowerId: string) {
  return getBorrower(borrowerId).then((borrower) => {
    if (!borrower) {
      throw new Error('NOT_FOUND');
    }
    if (borrower.status !== BORROWER_STATUS.APPROVED) {
      throw new Error('VALIDATION:Admin fee can only be recorded for approved borrowers.');
    }
    return borrower;
  });
}

export async function recordAdminFee(
  input: {
    borrowerId: string;
    collectorId: string;
  },
  idempotencyKey?: string,
): Promise<FinancialTransaction> {
  return runWithIdempotency({
    scope: 'ADMIN_FEE_RECORD',
    actorUserId: input.collectorId,
    idempotencyKey,
    requestPayload: { borrowerId: input.borrowerId, collectorId: input.collectorId },
    responseStatus: 201,
    execute: async () => recordAdminFeeInner(input),
  });
}

async function recordAdminFeeInner(input: {
  borrowerId: string;
  collectorId: string;
}): Promise<FinancialTransaction> {
  const borrower = await assertApprovedBorrower(input.borrowerId);

  if (await hasAdminFee(input.borrowerId)) {
    throw new Error('DUPLICATE');
  }

  const settings = await getSettings();
  const transaction: FinancialTransaction = {
    id: uuidv7(),
    type: 'ADMIN_FEE',
    borrowerId: input.borrowerId,
    amountPesewas: settings.adminFeePesewas,
    collectorId: input.collectorId,
    recordedAt: new Date().toISOString(),
  };

  await saveAdminFee({
    borrowerId: input.borrowerId,
    collectorId: input.collectorId,
    amountPesewas: settings.adminFeePesewas,
    transactionId: transaction.id,
    recordedAt: transaction.recordedAt,
  });

  let loanDisplayId: string | undefined;
  let loanId: string | undefined;
  try {
    const loans = await loanRepo.listBorrowerLoans(input.borrowerId);
    const latest = loans[0];
    if (latest) {
      loanId = latest.id;
      loanDisplayId = formatLoanDisplayId({
        cycleBatch: latest.cycleBatch,
        startDate: latest.startDate,
        sequence: 1,
      });
    }
  } catch {
    // Loan lookup is best-effort for notification copy.
  }

  const collector = isDatabaseEnabled()
    ? await userRepo.getUserById(input.collectorId).catch(() => null)
    : null;

  void notifyAdminFeeRecorded({
    transactionId: transaction.id,
    borrowerId: input.borrowerId,
    borrowerName: borrower.fullName,
    borrowerPhone: borrower.phone,
    borrowerEmail: borrower.profile?.email,
    amountPesewas: settings.adminFeePesewas,
    paymentDate: transaction.recordedAt,
    loanDisplayId,
    loanId,
    collectorUserId: input.collectorId,
    actorUserId: input.collectorId,
    actorDisplayName: collector?.displayName,
  }).catch(() => {
    // Notification failures must not roll back the recorded fee.
  });

  return { ...transaction };
}

export async function getAdminFeeStatus(borrowerId: string): Promise<AdminFeeStatus> {
  const borrower = await assertApprovedBorrower(borrowerId);
  const settings = await getSettings();
  const existingFee = await getAdminFee(borrowerId);

  let collectorName: string | undefined;
  if (existingFee && isDatabaseEnabled()) {
    const collector = await userRepo.getUserById(existingFee.collectorId);
    collectorName = collector?.displayName;
  }

  return {
    borrowerId,
    borrowerName: borrower.fullName,
    requiredAmountPesewas: settings.adminFeePesewas,
    isPaid: Boolean(existingFee),
    paidAt: existingFee?.recordedAt,
    recordedByCollectorId: existingFee?.collectorId,
    recordedByCollectorName: collectorName ?? (existingFee ? 'Collector' : undefined),
    transactionId: existingFee?.transactionId,
  };
}

export async function listBorrowersAwaitingAdminFee(): Promise<AwaitingAdminFeeBorrower[]> {
  const settings = await getSettings();
  const requiredAmountPesewas = settings.adminFeePesewas;

  if (isDatabaseEnabled()) {
    const borrowers = await listApprovedBorrowersWithoutAdminFee();
    return borrowers.map((borrower) => ({
      id: borrower.id,
      fullName: borrower.fullName,
      phone: borrower.phone,
      community: borrower.community,
      groupName: borrower.groupName || '—',
      requiredAmountPesewas,
    }));
  }

  return memory.listBorrowersAwaitingAdminFeeInMemory(requiredAmountPesewas);
}

export async function listCollectedAdminFees(filter?: {
  collectorId?: string;
}): Promise<CollectedAdminFeeRecord[]> {
  const fees = await listAdminFees(filter);
  if (fees.length === 0) {
    return [];
  }

  const borrowers = await listBorrowers();
  const borrowerById = new Map(borrowers.map((borrower) => [borrower.id, borrower]));

  const collectorIds = [...new Set(fees.map((fee) => fee.collectorId))];
  const collectorNames = new Map<string, string>();
  if (isDatabaseEnabled()) {
    await Promise.all(
      collectorIds.map(async (collectorId) => {
        const collector = await userRepo.getUserById(collectorId).catch(() => null);
        if (collector?.displayName) {
          collectorNames.set(collectorId, collector.displayName);
        }
      }),
    );
  }

  return fees.map((fee) => {
    const borrower = borrowerById.get(fee.borrowerId);
    return {
      borrowerId: fee.borrowerId,
      borrowerName: borrower?.fullName ?? 'Borrower',
      phone: borrower?.phone ?? '—',
      community: borrower?.community ?? '—',
      groupName: borrower?.groupName || '—',
      amountPesewas: fee.amountPesewas,
      collectorId: fee.collectorId,
      collectorName: collectorNames.get(fee.collectorId),
      transactionId: fee.transactionId,
      recordedAt: fee.recordedAt,
    };
  });
}

/** Borrower admin fees are per borrower before first loan — never required on collector login. */
export async function getCollectorAdminFeeLoginGate(_collectorId: string): Promise<{
  requiresPrompt: false;
}> {
  return { requiresPrompt: false };
}
