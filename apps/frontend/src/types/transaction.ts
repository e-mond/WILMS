export const TRANSACTION_TYPE = {
  DISBURSEMENT: 'DISBURSEMENT',
  REPAYMENT: 'REPAYMENT',
  ADMIN_FEE: 'ADMIN_FEE',
  WITHDRAWAL: 'WITHDRAWAL',
  ADJUSTMENT: 'ADJUSTMENT',
} as const;

export type TransactionType = (typeof TRANSACTION_TYPE)[keyof typeof TRANSACTION_TYPE];

export interface FinancialTransaction {
  id: string;
  type: TransactionType;
  borrowerId: string;
  /** Present on disbursement and repayment transactions tied to a specific loan. */
  loanId?: string;
  amountPesewas: number;
  collectorId: string;
  recordedAt: string;
}

export interface RecordAdminFeeInput {
  borrowerId: string;
  collectorId: string;
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

export interface DisbursementEligibility {
  borrowerId: string;
  canDisburse: boolean;
  reason?: string;
}
