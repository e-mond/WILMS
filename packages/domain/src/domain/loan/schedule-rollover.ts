import { adjustDueDateForHolidays, normalizeHolidayDates } from './holiday-shift.js';
import { getCadenceDayOffset, type RepaymentCadence } from './schedule-cadence.js';
import type { ScheduleWeekDraft } from './schedule.js';

function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * When loan rollovers are enabled, each missed week extends the schedule by one
 * PENDING week at the end so borrowers and staff can see catch-up obligations.
 */
export function buildRolloverWeekDrafts(input: {
  existingWeeks: Array<{ weekNumber: number; dueDate: string; status: string }>;
  durationWeeks: number;
  weeklyPaymentPesewas: number;
  allowRollovers: boolean;
  cadence?: RepaymentCadence;
  holidayDates?: Iterable<string>;
}): ScheduleWeekDraft[] {
  if (!input.allowRollovers || input.existingWeeks.length === 0) {
    return [];
  }

  const missedCount = input.existingWeeks.filter((week) => week.status === 'MISSED').length;
  if (missedCount === 0) {
    return [];
  }

  const targetWeekCount = input.durationWeeks + missedCount;
  const weeksToAdd = targetWeekCount - input.existingWeeks.length;
  if (weeksToAdd <= 0) {
    return [];
  }

  const holidayDates = normalizeHolidayDates(input.holidayDates);
  const dayOffset = getCadenceDayOffset(input.cadence ?? 'WEEKLY');
  const sorted = [...input.existingWeeks].sort((a, b) => a.weekNumber - b.weekNumber);
  const lastWeek = sorted[sorted.length - 1]!;

  let nextDueDate = lastWeek.dueDate;
  let nextWeekNumber = lastWeek.weekNumber;
  const drafts: ScheduleWeekDraft[] = [];

  for (let index = 0; index < weeksToAdd; index += 1) {
    nextWeekNumber += 1;
    nextDueDate = adjustDueDateForHolidays(addDays(nextDueDate, dayOffset), holidayDates);
    drafts.push({
      weekNumber: nextWeekNumber,
      dueDate: nextDueDate,
      amountPesewas: input.weeklyPaymentPesewas,
      status: 'PENDING',
    });
  }

  return drafts;
}

export function resolveNextScheduleDueDate(input: {
  weeks: Array<{ weekNumber: number; dueDate: string; status: string }>;
  effectiveFrom: string;
}): string | null {
  const unpaid = input.weeks
    .filter(
      (week) =>
        (week.status === 'PENDING' || week.status === 'MISSED') &&
        week.dueDate >= input.effectiveFrom,
    )
    .sort((a, b) => a.weekNumber - b.weekNumber);

  return unpaid[0]?.dueDate ?? null;
}
