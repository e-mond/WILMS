import { decimalToPesewas, parseDecimal } from '../money.js';
import { formatLoanDisplayId } from '@wilms/shared-utils';
import type { loans } from '../../db/schema/loans.js';
import type { loanSchedules } from '../../db/schema/loan-schedules.js';

export interface LoanDetailDto {
  id: string;
  displayId: string;
  borrowerId: string;
  amountPesewas: number;
  durationWeeks: number;
  weeklyPaymentPesewas: number;
  status: string;
  paymentDay: string;
  startDate: string;
  cycleBatch: string;
  outstandingPesewas: number;
}

export function mapLoanRowToDetail(
  row: typeof loans.$inferSelect,
  sequence = 1,
): LoanDetailDto {
  const amountPesewas = decimalToPesewas(row.principalAmount);
  const outstandingPesewas = decimalToPesewas(row.loanBalance);
  const weeklyPaymentPesewas = decimalToPesewas(row.installmentAmount);

  return {
    id: row.id,
    displayId: formatLoanDisplayId({
      cycleBatch: row.cycleBatch,
      startDate: row.startDate,
      sequence,
    }),
    borrowerId: row.borrowerId,
    amountPesewas,
    durationWeeks: row.durationWeeks,
    weeklyPaymentPesewas,
    status: row.externalStatus,
    paymentDay: row.paymentDay,
    startDate: row.startDate,
    cycleBatch: row.cycleBatch,
    outstandingPesewas,
  };
}

export interface ScheduleWeekDto {
  weekNumber: number;
  dueDate: string;
  amountPesewas: number;
  status: string;
}

export function mapScheduleRow(row: typeof loanSchedules.$inferSelect): ScheduleWeekDto {
  return {
    weekNumber: row.weekNumber,
    dueDate: row.dueDate,
    amountPesewas: decimalToPesewas(row.installmentAmount),
    status: row.status,
  };
}

export interface LoanProgressDto {
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

export function calculateLoanProgress(input: {
  loanId: string;
  amountPesewas: number;
  scheduleWeeks: ScheduleWeekDto[];
  totalPaidPesewas: number;
  referenceDate?: string;
}): LoanProgressDto {
  const referenceDate = input.referenceDate ?? new Date().toISOString().slice(0, 10);
  const remainingBalancePesewas = Math.max(input.amountPesewas - input.totalPaidPesewas, 0);
  const percentRepaid =
    input.amountPesewas === 0
      ? 0
      : Math.round((input.totalPaidPesewas / input.amountPesewas) * 100);
  const weeksCompleted = input.scheduleWeeks.filter((week) => week.status === 'PAID').length;
  const weeksRemaining = Math.max(input.scheduleWeeks.length - weeksCompleted, 0);
  const totalMissed = input.scheduleWeeks.filter((week) => week.status === 'MISSED').length;
  const elapsedWeeks = input.scheduleWeeks.filter((week) => week.dueDate <= referenceDate).length;
  const paymentConsistencyScore =
    elapsedWeeks === 0 ? 100 : Math.round((weeksCompleted / elapsedWeeks) * 100);

  return {
    loanId: input.loanId,
    amountPesewas: input.amountPesewas,
    totalPaidPesewas: input.totalPaidPesewas,
    remainingBalancePesewas,
    percentRepaid,
    weeksCompleted,
    weeksRemaining,
    totalMissed,
    elapsedWeeks,
    paymentConsistencyScore,
  };
}

export function sumRepaymentLedgerAmounts(
  rows: Array<{ entryType: string; amount: string | null }>,
): number {
  return rows
    .filter((row) => row.entryType === 'REPAYMENT')
    .reduce((total, row) => total + decimalToPesewas(parseDecimal(row.amount)), 0);
}
