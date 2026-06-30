import { uuidv7 } from 'uuidv7';
import { BORROWER_STATUS } from '@wilms/shared-contracts';
import { getBorrower, listBorrowers } from '../../db/persistence.js';
import { getSettings } from '../settings/service.js';
import * as userRepo from '../../repositories/user.repository.js';
import { isDatabaseEnabled } from '../../db/client.js';

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

  if (adminFeeTransactions.has(input.borrowerId)) {
    throw new Error('DUPLICATE');
  }

  const transaction: FinancialTransaction = {
    id: uuidv7(),
    type: 'ADMIN_FEE',
    borrowerId: input.borrowerId,
    amountPesewas: getSettings().adminFeePesewas,
    collectorId: input.collectorId,
    recordedAt: new Date().toISOString(),
  };

  adminFeeTransactions.set(input.borrowerId, transaction);
  void borrower;
  return { ...transaction };
}

export async function getAdminFeeStatus(borrowerId: string): Promise<AdminFeeStatus> {
  const borrower = await assertApprovedBorrower(borrowerId);
  const existingFee = adminFeeTransactions.get(borrowerId);
  let collectorName: string | undefined;

  if (existingFee && isDatabaseEnabled()) {
    const collector = await userRepo.getUserById(existingFee.collectorId);
    collectorName = collector?.displayName;
  }

  return {
    borrowerId,
    borrowerName: borrower.fullName,
    requiredAmountPesewas: getSettings().adminFeePesewas,
    isPaid: Boolean(existingFee),
    paidAt: existingFee?.recordedAt,
    recordedByCollectorId: existingFee?.collectorId,
    recordedByCollectorName: collectorName ?? (existingFee ? 'Collector' : undefined),
    transactionId: existingFee?.id,
  };
}

export async function listBorrowersAwaitingAdminFee(): Promise<AwaitingAdminFeeBorrower[]> {
  const borrowers = await listBorrowers();
  const requiredAmountPesewas = getSettings().adminFeePesewas;

  return borrowers
    .filter(
      (borrower) =>
        borrower.status === BORROWER_STATUS.APPROVED && !adminFeeTransactions.has(borrower.id),
    )
    .map((borrower) => ({
      id: borrower.id,
      fullName: borrower.fullName,
      phone: borrower.phone,
      community: borrower.community,
      groupName: borrower.groupName || '—',
      requiredAmountPesewas,
    }))
    .sort((left, right) => left.fullName.localeCompare(right.fullName));
}
