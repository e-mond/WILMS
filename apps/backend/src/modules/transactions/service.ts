import { eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { BORROWER_STATUS } from '@wilms/shared-contracts';
import {
  getAdminFee,
  getBorrower,
  hasAdminFee,
  listApprovedBorrowersWithoutAdminFee,
  saveAdminFee,
} from '../../db/persistence.js';
import * as memory from '../../db/store.js';
import { isDatabaseEnabled } from '../../db/client.js';
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

  void borrower;
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

/** Borrower admin fees are per borrower before first loan — never required on collector login. */
export async function getCollectorAdminFeeLoginGate(_collectorId: string): Promise<{
  requiresPrompt: false;
}> {
  return { requiresPrompt: false };
}
