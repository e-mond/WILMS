import { isLoanDueOnDate } from './weekday.js';

export interface ExpectedDueLoanInput {
  paymentDay: string;
  weeklyPaymentPesewas: number;
}

export interface SystemRecordedPaymentInput {
  amountPesewas: number;
  status: 'CONFIRMED' | 'PENDING_SYNC' | 'REVERSED';
}

/**
 * ExpectedCashFormula v1 (P14.3B.4B):
 * Sum weekly_payment for loans due on reconciliation_date (schedule-based).
 */
export function calculateExpectedDuePesewas(
  loans: ExpectedDueLoanInput[],
  reconciliationDate: string,
): number {
  return loans
    .filter((loan) => isLoanDueOnDate(loan.paymentDay, reconciliationDate))
    .reduce((total, loan) => total + loan.weeklyPaymentPesewas, 0);
}

/**
 * SystemRecordedFormula v1: CONFIRMED payments only — REVERSED excluded.
 */
export function calculateSystemRecordedPesewas(payments: SystemRecordedPaymentInput[]): number {
  return payments
    .filter((payment) => payment.status === 'CONFIRMED')
    .reduce((total, payment) => total + payment.amountPesewas, 0);
}
