import { TRANSACTION_TYPE, type FinancialTransaction } from '@/types/transaction';

const SEED_TRANSACTIONS: FinancialTransaction[] = [
  {
    id: 'txn-admin-fee-001',
    type: TRANSACTION_TYPE.ADMIN_FEE,
    borrowerId: 'borrower-001',
    amountPesewas: 5000,
    collectorId: 'user-collector',
    recordedAt: '2026-01-20T09:00:00.000Z',
  },
  {
    id: 'txn-admin-fee-003',
    type: TRANSACTION_TYPE.ADMIN_FEE,
    borrowerId: 'borrower-003',
    amountPesewas: 5000,
    collectorId: 'user-collector',
    recordedAt: '2026-03-15T09:00:00.000Z',
  },
  {
    id: 'txn-admin-fee-004',
    type: TRANSACTION_TYPE.ADMIN_FEE,
    borrowerId: 'borrower-004',
    amountPesewas: 5000,
    collectorId: 'user-collector-2',
    recordedAt: '2026-03-28T09:00:00.000Z',
  },
  {
    id: 'txn-admin-fee-005',
    type: TRANSACTION_TYPE.ADMIN_FEE,
    borrowerId: 'borrower-005',
    amountPesewas: 5000,
    collectorId: 'user-collector-3',
    recordedAt: '2026-04-10T09:00:00.000Z',
  },
  {
    id: 'txn-admin-fee-006',
    type: TRANSACTION_TYPE.ADMIN_FEE,
    borrowerId: 'borrower-006',
    amountPesewas: 5000,
    collectorId: 'user-collector-4',
    recordedAt: '2026-02-25T09:00:00.000Z',
  },
  {
    id: 'txn-disbursement-001',
    type: TRANSACTION_TYPE.DISBURSEMENT,
    borrowerId: 'borrower-001',
    loanId: 'loan-001',
    amountPesewas: 50000,
    collectorId: 'user-collector',
    recordedAt: '2026-05-01T10:00:00.000Z',
  },
  {
    id: 'txn-disbursement-002',
    type: TRANSACTION_TYPE.DISBURSEMENT,
    borrowerId: 'borrower-004',
    loanId: 'loan-002',
    amountPesewas: 48000,
    collectorId: 'user-collector-2',
    recordedAt: '2026-04-01T10:00:00.000Z',
  },
  {
    id: 'txn-disbursement-003',
    type: TRANSACTION_TYPE.DISBURSEMENT,
    borrowerId: 'borrower-005',
    loanId: 'loan-003',
    amountPesewas: 35000,
    collectorId: 'user-collector-3',
    recordedAt: '2026-04-15T10:00:00.000Z',
  },
  {
    id: 'txn-disbursement-004',
    type: TRANSACTION_TYPE.DISBURSEMENT,
    borrowerId: 'borrower-006',
    loanId: 'loan-004',
    amountPesewas: 96000,
    collectorId: 'user-collector-4',
    recordedAt: '2026-03-01T10:00:00.000Z',
  },
  {
    id: 'txn-repayment-001',
    type: TRANSACTION_TYPE.REPAYMENT,
    borrowerId: 'borrower-001',
    loanId: 'loan-001',
    amountPesewas: 5000,
    collectorId: 'user-collector',
    recordedAt: '2026-05-09T14:30:00.000Z',
  },
  {
    id: 'txn-repayment-002',
    type: TRANSACTION_TYPE.REPAYMENT,
    borrowerId: 'borrower-001',
    loanId: 'loan-001',
    amountPesewas: 5000,
    collectorId: 'user-collector',
    recordedAt: '2026-05-16T14:30:00.000Z',
  },
  {
    id: 'txn-repayment-003',
    type: TRANSACTION_TYPE.REPAYMENT,
    borrowerId: 'borrower-001',
    loanId: 'loan-001',
    amountPesewas: 5000,
    collectorId: 'user-collector',
    recordedAt: '2026-05-23T14:30:00.000Z',
  },
  {
    id: 'txn-repayment-004',
    type: TRANSACTION_TYPE.REPAYMENT,
    borrowerId: 'borrower-004',
    loanId: 'loan-002',
    amountPesewas: 4000,
    collectorId: 'user-collector-2',
    recordedAt: '2026-04-08T11:00:00.000Z',
  },
  {
    id: 'txn-repayment-005',
    type: TRANSACTION_TYPE.REPAYMENT,
    borrowerId: 'borrower-004',
    loanId: 'loan-002',
    amountPesewas: 4000,
    collectorId: 'user-collector-2',
    recordedAt: '2026-04-15T11:00:00.000Z',
  },
  {
    id: 'txn-repayment-006',
    type: TRANSACTION_TYPE.REPAYMENT,
    borrowerId: 'borrower-004',
    loanId: 'loan-002',
    amountPesewas: 4000,
    collectorId: 'user-collector-2',
    recordedAt: '2026-04-22T11:00:00.000Z',
  },
  {
    id: 'txn-repayment-007',
    type: TRANSACTION_TYPE.REPAYMENT,
    borrowerId: 'borrower-004',
    loanId: 'loan-002',
    amountPesewas: 4000,
    collectorId: 'user-collector-2',
    recordedAt: '2026-04-29T11:00:00.000Z',
  },
  {
    id: 'txn-repayment-008',
    type: TRANSACTION_TYPE.REPAYMENT,
    borrowerId: 'borrower-005',
    loanId: 'loan-003',
    amountPesewas: 3500,
    collectorId: 'user-collector-3',
    recordedAt: '2026-04-22T12:00:00.000Z',
  },
  {
    id: 'txn-repayment-009',
    type: TRANSACTION_TYPE.REPAYMENT,
    borrowerId: 'borrower-005',
    loanId: 'loan-003',
    amountPesewas: 3500,
    collectorId: 'user-collector-3',
    recordedAt: '2026-04-29T12:00:00.000Z',
  },
  {
    id: 'txn-repayment-010',
    type: TRANSACTION_TYPE.REPAYMENT,
    borrowerId: 'borrower-005',
    loanId: 'loan-003',
    amountPesewas: 3500,
    collectorId: 'user-collector-3',
    recordedAt: '2026-05-06T12:00:00.000Z',
  },
  {
    id: 'txn-repayment-011',
    type: TRANSACTION_TYPE.REPAYMENT,
    borrowerId: 'borrower-006',
    loanId: 'loan-004',
    amountPesewas: 6000,
    collectorId: 'user-collector-4',
    recordedAt: '2026-03-07T15:00:00.000Z',
  },
  {
    id: 'txn-repayment-012',
    type: TRANSACTION_TYPE.REPAYMENT,
    borrowerId: 'borrower-006',
    loanId: 'loan-004',
    amountPesewas: 6000,
    collectorId: 'user-collector-4',
    recordedAt: '2026-03-14T15:00:00.000Z',
  },
  {
    id: 'txn-repayment-013',
    type: TRANSACTION_TYPE.REPAYMENT,
    borrowerId: 'borrower-006',
    loanId: 'loan-004',
    amountPesewas: 6000,
    collectorId: 'user-collector-4',
    recordedAt: '2026-03-21T15:00:00.000Z',
  },
  {
    id: 'txn-repayment-014',
    type: TRANSACTION_TYPE.REPAYMENT,
    borrowerId: 'borrower-006',
    loanId: 'loan-004',
    amountPesewas: 6000,
    collectorId: 'user-collector-4',
    recordedAt: '2026-03-28T15:00:00.000Z',
  },
  {
    id: 'txn-repayment-015',
    type: TRANSACTION_TYPE.REPAYMENT,
    borrowerId: 'borrower-006',
    loanId: 'loan-004',
    amountPesewas: 6000,
    collectorId: 'user-collector-4',
    recordedAt: '2026-04-04T15:00:00.000Z',
  },
  {
    id: 'txn-repayment-016',
    type: TRANSACTION_TYPE.REPAYMENT,
    borrowerId: 'borrower-006',
    loanId: 'loan-004',
    amountPesewas: 6000,
    collectorId: 'user-collector-4',
    recordedAt: '2026-04-11T15:00:00.000Z',
  },
];

let transactions: FinancialTransaction[] = [...SEED_TRANSACTIONS];
let nextTransactionId = transactions.length + 1;

export function getFinancialTransactions(): readonly FinancialTransaction[] {
  return transactions;
}

export function appendFinancialTransaction(
  entry: Omit<FinancialTransaction, 'id'>,
): FinancialTransaction {
  const transaction: FinancialTransaction = {
    ...entry,
    id: `txn-${String(nextTransactionId).padStart(3, '0')}`,
  };

  nextTransactionId += 1;
  transactions = [...transactions, transaction];
  return transaction;
}

export function findAdminFeeForBorrower(borrowerId: string): FinancialTransaction | undefined {
  return transactions.find(
    (transaction) =>
      transaction.borrowerId === borrowerId && transaction.type === TRANSACTION_TYPE.ADMIN_FEE,
  );
}

export function getTransactionsForLoan(loanId: string): FinancialTransaction[] {
  return transactions.filter((transaction) => transaction.loanId === loanId);
}

export function resetFinancialTransactions(): void {
  transactions = [...SEED_TRANSACTIONS];
  nextTransactionId = transactions.length + 1;
}
