import { getCadenceDayOffset, type RepaymentCadence } from './schedule-cadence.js';

export const PAYMENT_DAY_TO_JS_DAY: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

export interface ScheduleWeekDraft {
  weekNumber: number;
  dueDate: string;
  amountPesewas: number;
  status: 'PENDING';
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

export function generateLoanScheduleWeeks(input: {
  durationWeeks: number;
  weeklyPaymentPesewas: number;
  startDate: string;
  paymentDay: string;
  cadence?: RepaymentCadence;
}): ScheduleWeekDraft[] {
  const firstDueIso = getFirstDueDateIso(input.startDate, input.paymentDay);
  const dayOffset = getCadenceDayOffset(input.cadence ?? 'WEEKLY');

  return Array.from({ length: input.durationWeeks }, (_, index) => ({
    weekNumber: index + 1,
    dueDate: addDays(firstDueIso, index * dayOffset),
    amountPesewas: input.weeklyPaymentPesewas,
    status: 'PENDING' as const,
  }));
}

export function getWeekdayNameFromIsoDate(isoDate: string): string {
  const day = parseIsoDate(isoDate).getUTCDay();
  return Object.entries(PAYMENT_DAY_TO_JS_DAY).find(([, value]) => value === day)?.[0] ?? 'Monday';
}
