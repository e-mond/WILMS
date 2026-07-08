import { eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { BORROWER_STATUS } from '@wilms/shared-contracts';
import { getBorrower, listBorrowers } from '../../db/persistence.js';
import { getDb, isDatabaseEnabled } from '../../db/client.js';
import { borrowerAdminFees } from '../../db/schema/borrower-admin-fees.js';
import { getSettings } from '../settings/service.js';
import * as userRepo from '../../repositories/user.repository.js';

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

const adminFeeTransactions = new Map<string, FinancialTransaction>();

async function loadPersistedAdminFee(
  borrowerId: string,
): Promise<typeof borrowerAdminFees.$inferSelect | undefined> {
  if (!isDatabaseEnabled()) {
    return undefined;
  }

  const db = getDb();
  const [row] = await db
    .select()
    .from(borrowerAdminFees)
    .where(eq(borrowerAdminFees.borrowerId, borrowerId))
    .limit(1);
  return row;
}

async function hasPersistedAdminFee(borrowerId: string): Promise<boolean> {
  const row = await loadPersistedAdminFee(borrowerId);
  return Boolean(row);
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

export async function recordAdminFee(input: {
  borrowerId: string;
  collectorId: string;
}): Promise<FinancialTransaction> {
  const borrower = await assertApprovedBorrower(input.borrowerId);

  if (isDatabaseEnabled()) {
    const existing = await loadPersistedAdminFee(input.borrowerId);
    if (existing) {
      throw new Error('DUPLICATE');
    }
  } else if (adminFeeTransactions.has(input.borrowerId)) {
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

  if (isDatabaseEnabled()) {
    const db = getDb();
    await db.insert(borrowerAdminFees).values({
      borrowerId: input.borrowerId,
      collectorUserId: input.collectorId,
      amountPesewas: settings.adminFeePesewas,
      transactionId: transaction.id,
      recordedAt: new Date(transaction.recordedAt),
    });
  } else {
    adminFeeTransactions.set(input.borrowerId, transaction);
  }

  void borrower;
  return { ...transaction };
}

export async function getAdminFeeStatus(borrowerId: string): Promise<AdminFeeStatus> {
  const borrower = await assertApprovedBorrower(borrowerId);
  const settings = await getSettings();

  const persisted = await loadPersistedAdminFee(borrowerId);
  const memoryFee = adminFeeTransactions.get(borrowerId);
  const existingFee = persisted
    ? {
        collectorId: persisted.collectorUserId,
        recordedAt: persisted.recordedAt.toISOString(),
        id: persisted.transactionId,
      }
    : memoryFee
      ? {
          collectorId: memoryFee.collectorId,
          recordedAt: memoryFee.recordedAt,
          id: memoryFee.id,
        }
      : undefined;

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
    transactionId: existingFee?.id,
  };
}

export async function listBorrowersAwaitingAdminFee(): Promise<AwaitingAdminFeeBorrower[]> {
  const borrowers = await listBorrowers();
  const settings = await getSettings();
  const requiredAmountPesewas = settings.adminFeePesewas;

  const awaiting: AwaitingAdminFeeBorrower[] = [];

  for (const borrower of borrowers) {
    if (borrower.status !== BORROWER_STATUS.APPROVED) {
      continue;
    }

    const paid = isDatabaseEnabled()
      ? await hasPersistedAdminFee(borrower.id)
      : adminFeeTransactions.has(borrower.id);

    if (paid) {
      continue;
    }

    awaiting.push({
      id: borrower.id,
      fullName: borrower.fullName,
      phone: borrower.phone,
      community: borrower.community,
      groupName: borrower.groupName || '—',
      requiredAmountPesewas,
    });
  }

  return awaiting.sort((left, right) => left.fullName.localeCompare(right.fullName));
}

/** Borrower admin fees are per borrower before first loan — never required on collector login. */
export async function getCollectorAdminFeeLoginGate(_collectorId: string): Promise<{
  requiresPrompt: false;
}> {
  return { requiresPrompt: false };
}
