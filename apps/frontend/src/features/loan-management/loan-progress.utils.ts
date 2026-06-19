import { SCHEDULE_WEEK_STATUS, type LoanScheduleWeek } from '@/types/loan-schedule';
import type { LoanProgressSummary } from '@/types/loan';
import { TRANSACTION_TYPE, type FinancialTransaction } from '@/types/transaction';

export interface CalculateLoanProgressInput {
  loanId: string;
  amountPesewas: number;
  scheduleWeeks: LoanScheduleWeek[];
  transactions: readonly FinancialTransaction[];
  referenceDate?: string;
}

export function sumConfirmedRepaymentsPesewas(
  transactions: readonly FinancialTransaction[],
  loanId: string,
): number {
  return transactions
    .filter(
      (transaction) =>
        transaction.loanId === loanId && transaction.type === TRANSACTION_TYPE.REPAYMENT,
    )
    .reduce((total, transaction) => total + transaction.amountPesewas, 0);
}

export function countElapsedScheduleWeeks(
  scheduleWeeks: LoanScheduleWeek[],
  referenceDate: string,
): number {
  return scheduleWeeks.filter((week) => week.dueDate <= referenceDate).length;
}

/**
 * AMB-006: payment consistency = (paid weeks ÷ elapsed weeks) × 100.
 * Elapsed weeks are installments whose due date is on or before the reference date.
 */
export function calculateLoanProgress({
  loanId,
  amountPesewas,
  scheduleWeeks,
  transactions,
  referenceDate = new Date().toISOString().slice(0, 10),
}: CalculateLoanProgressInput): LoanProgressSummary {
  const totalPaidPesewas = sumConfirmedRepaymentsPesewas(transactions, loanId);
  const remainingBalancePesewas = Math.max(amountPesewas - totalPaidPesewas, 0);
  const percentRepaid =
    amountPesewas === 0 ? 0 : Math.round((totalPaidPesewas / amountPesewas) * 100);

  const weeksCompleted = scheduleWeeks.filter(
    (week) => week.status === SCHEDULE_WEEK_STATUS.PAID,
  ).length;
  const weeksRemaining = Math.max(scheduleWeeks.length - weeksCompleted, 0);
  const totalMissed = scheduleWeeks.filter(
    (week) => week.status === SCHEDULE_WEEK_STATUS.MISSED,
  ).length;
  const elapsedWeeks = countElapsedScheduleWeeks(scheduleWeeks, referenceDate);
  const paymentConsistencyScore =
    elapsedWeeks === 0 ? 100 : Math.round((weeksCompleted / elapsedWeeks) * 100);

  return {
    loanId,
    amountPesewas,
    totalPaidPesewas,
    remainingBalancePesewas,
    percentRepaid,
    weeksCompleted,
    weeksRemaining,
    totalMissed,
    elapsedWeeks,
    paymentConsistencyScore,
  };
}
