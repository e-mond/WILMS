import { PAYMENT_DAY_TO_JS_DAY } from '@/constants/loan-schedule';
import {
  SCHEDULE_WEEK_STATUS,
  type LoanScheduleWeek,
} from '@/types/loan-schedule';

export interface GenerateLoanScheduleInput {
  durationWeeks: number;
  weeklyPaymentPesewas: number;
  startDate: string;
  paymentDay: string;
}

function parseIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(isoDate: string, days: number): string {
  const date = parseIsoDate(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return formatIsoDate(date);
}

export function getFirstDueDateIso(startDate: string, paymentDay: string): string {
  const start = parseIsoDate(startDate);
  const targetDay = PAYMENT_DAY_TO_JS_DAY[paymentDay] ?? 1;
  const currentDay = start.getUTCDay();
  const daysUntil = (targetDay - currentDay + 7) % 7;
  return addDays(startDate, daysUntil);
}

export function generateLoanSchedule(input: GenerateLoanScheduleInput): LoanScheduleWeek[] {
  const firstDueIso = getFirstDueDateIso(input.startDate, input.paymentDay);

  return Array.from({ length: input.durationWeeks }, (_, index) => ({
    weekNumber: index + 1,
    dueDate: addDays(firstDueIso, index * 7),
    amountPesewas: input.weeklyPaymentPesewas,
    status: SCHEDULE_WEEK_STATUS.PENDING,
  }));
}
