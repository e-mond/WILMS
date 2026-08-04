import { isLoanDueOnDate } from './weekday.js';

export interface ExpectedDueLoanInput {
  /** Present when matching schedule dues to loans (avoids double-counting). */
  id?: string;
  paymentDay: string;
  weeklyPaymentPesewas: number;
}

export interface ScheduleDueInstallmentInput {
  loanId: string;
  installmentPesewas: number;
}

export interface SystemRecordedPaymentInput {
  amountPesewas: number;
  status: 'CONFIRMED' | 'PENDING_SYNC' | 'REVERSED';
}

/**
 * ExpectedCashFormula v1 (P14.3B.4B):
 * Prefer schedule weeks due on reconciliation_date (includes holiday shifts).
 * Fall back to payment-day match for active loans with no schedule row that day.
 */
export function calculateExpectedDuePesewas(
  loans: ExpectedDueLoanInput[],
  reconciliationDate: string,
  scheduleDues: ScheduleDueInstallmentInput[] = [],
): number {
  const scheduleTotal = scheduleDues.reduce(
    (total, week) => total + week.installmentPesewas,
    0,
  );
  const scheduledLoanIds = new Set(scheduleDues.map((week) => week.loanId));

  const paymentDayFallback = loans
    .filter((loan) => {
      if (loan.id && scheduledLoanIds.has(loan.id)) {
        return false;
      }
      return isLoanDueOnDate(loan.paymentDay, reconciliationDate);
    })
    .reduce((total, loan) => total + loan.weeklyPaymentPesewas, 0);

  return scheduleTotal + paymentDayFallback;
}

/**
 * SystemRecordedFormula v1: CONFIRMED payments only — REVERSED excluded.
 */
export function calculateSystemRecordedPesewas(payments: SystemRecordedPaymentInput[]): number {
  return payments
    .filter((payment) => payment.status === 'CONFIRMED')
    .reduce((total, payment) => total + payment.amountPesewas, 0);
}
