export const LOAN_STATUS = {
  PENDING_DISBURSEMENT: 'PENDING_DISBURSEMENT',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  DEFAULTED: 'DEFAULTED',
  WRITTEN_OFF: 'WRITTEN_OFF',
} as const;

export type LoanStatus = (typeof LOAN_STATUS)[keyof typeof LOAN_STATUS];

export interface LoanSummary {
  id: string;
  displayId?: string;
  borrowerId: string;
  amountPesewas: number;
  durationWeeks: number;
  weeklyPaymentPesewas: number;
  status: LoanStatus;
}

export interface LoanDetail extends LoanSummary {
  paymentDay: string;
  startDate: string;
  cycleBatch: string;
  outstandingPesewas: number;
}

export interface LoanEligibleBorrower {
  id: string;
  fullName: string;
  phone: string;
  community: string;
  groupName: string;
}

export interface CreateLoanInput {
  borrowerId: string;
  amountPesewas: number;
  durationWeeks: number;
  paymentDay: string;
  cycleBatch: string;
  startDate: string;
}

export interface RejectLoanInput {
  reason: string;
}

export interface LoanPortfolioEntry {
  id: string;
  displayId?: string;
  borrowerId: string;
  borrowerName: string;
  community: string;
  groupName: string;
  amountPesewas: number;
  outstandingPesewas: number;
  weeklyPaymentPesewas: number;
  durationWeeks: number;
  status: LoanStatus;
  cycleBatch: string;
  paymentDay: string;
  startDate: string;
}

export interface LoanPortfolioSummary {
  totalLoans: number;
  activeLoans: number;
  totalDisbursedPesewas: number;
  totalOutstandingPesewas: number;
}

export interface CreateLoanFormValues {
  borrowerId: string;
  amountGhs: string;
  durationWeeks: number;
  paymentDay: string;
  cycleBatch: string;
  startDate: string;
}

export interface BorrowerLoanHistoryEntry {
  id: string;
  amountPesewas: number;
  outstandingPesewas: number;
  weeklyPaymentPesewas: number;
  durationWeeks: number;
  status: LoanStatus;
  cycleBatch: string;
  startDate: string;
}

/**
 * Derived from confirmed repayment transactions and schedule state.
 * Payment consistency score (AMB-006): (paid weeks ÷ elapsed weeks) × 100.
 */
export interface LoanProgressSummary {
  loanId: string;
  amountPesewas: number;
  totalPaidPesewas: number;
  remainingBalancePesewas: number;
  percentRepaid: number;
  weeksCompleted: number;
  weeksRemaining: number;
  totalMissed: number;
  elapsedWeeks: number;
  paymentConsistencyScore: number;
}

export interface LoanPaymentLogEntry {
  id: string;
  type: 'DISBURSEMENT' | 'REPAYMENT';
  amountPesewas: number;
  recordedAt: string;
  collectorId: string;
  weekNumber?: number;
  receiptNumber?: string;
  gpsVerified?: boolean;
  paymentStatus?: 'CONFIRMED' | 'PENDING_SYNC';
}
