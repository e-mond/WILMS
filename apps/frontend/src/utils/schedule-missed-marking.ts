import { SCHEDULE_WEEK_STATUS, type LoanScheduleWeek } from '@/types/loan-schedule';

/**
 * BRD §9.2 — unpaid installments past their due date are auto-marked Missed.
 * Arrears carry forward; oldest missed obligations are collected first (PC-02).
 */
export function applyMissedWeekAutoMarking(
  weeks: LoanScheduleWeek[],
  referenceDate: string,
): LoanScheduleWeek[] {
  return weeks.map((week) => {
    if (week.status === SCHEDULE_WEEK_STATUS.PENDING && week.dueDate < referenceDate) {
      return { ...week, status: SCHEDULE_WEEK_STATUS.MISSED };
    }

    return week;
  });
}

export function countMissedWeeks(weeks: readonly LoanScheduleWeek[]): number {
  return weeks.filter((week) => week.status === SCHEDULE_WEEK_STATUS.MISSED).length;
}

export function countArrearsWeeks(
  weeks: readonly LoanScheduleWeek[],
  referenceDate: string,
): number {
  return weeks.filter(
    (week) =>
      week.status === SCHEDULE_WEEK_STATUS.MISSED ||
      (week.status === SCHEDULE_WEEK_STATUS.PENDING && week.dueDate < referenceDate),
  ).length;
}
