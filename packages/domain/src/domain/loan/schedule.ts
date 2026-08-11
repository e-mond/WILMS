import { getCadenceDayOffset, type RepaymentCadence } from './schedule-cadence.js';
import { adjustDueDateForHolidays, normalizeHolidayDates } from './holiday-shift.js';

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
  holidayDates?: Iterable<string>;
}): ScheduleWeekDraft[] {
  const firstDueIso = getFirstDueDateIso(input.startDate, input.paymentDay);
  const dayOffset = getCadenceDayOffset(input.cadence ?? 'WEEKLY');
  const holidayDates = normalizeHolidayDates(input.holidayDates);

  return Array.from({ length: input.durationWeeks }, (_, index) => {
    const rawDueDate = addDays(firstDueIso, index * dayOffset);
    const dueDate = adjustDueDateForHolidays(rawDueDate, holidayDates);

    return {
      weekNumber: index + 1,
      dueDate,
      amountPesewas: input.weeklyPaymentPesewas,
      status: 'PENDING' as const,
    };
  });
}

export function getWeekdayNameFromIsoDate(isoDate: string): string {
  const day = parseIsoDate(isoDate).getUTCDay();
  return Object.entries(PAYMENT_DAY_TO_JS_DAY).find(([, value]) => value === day)?.[0] ?? 'Monday';
}

/**
 * Recalculate future PENDING due dates onto a new payment weekday.
 * Historical (non-PENDING) weeks are left unchanged.
 */
export function recalculatePendingDueDatesForPaymentDay(input: {
  weeks: Array<{ weekNumber: number; dueDate: string; status: string }>;
  toPaymentDay: string;
  effectiveFrom: string;
  holidayDates?: Iterable<string>;
}): Array<{ weekNumber: number; dueDate: string }> {
  const holidayDates = normalizeHolidayDates(input.holidayDates);
  const pending = input.weeks
    .filter((week) => week.status === 'PENDING' && week.dueDate >= input.effectiveFrom)
    .sort((a, b) => a.weekNumber - b.weekNumber);

  if (pending.length === 0) {
    return [];
  }

  const firstDue = adjustDueDateForHolidays(
    getFirstDueDateIso(input.effectiveFrom, input.toPaymentDay),
    holidayDates,
  );

  return pending.map((week, index) => ({
    weekNumber: week.weekNumber,
    dueDate: adjustDueDateForHolidays(addDays(firstDue, index * 7), holidayDates),
  }));
}
