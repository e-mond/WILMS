import { BORROWER_STATUS, type BorrowerStatus } from '@/types/borrower';
import { SCHEDULE_WEEK_STATUS, type LoanScheduleWeek } from '@/types/loan-schedule';
import { LOAN_STATUS, type LoanStatus } from '@/types/loan';
import { countMissedWeeks } from '@/utils/schedule-missed-marking';

const DEFAULTED_CONSECUTIVE_MISSED_THRESHOLD = 2;

/**
 * Count consecutive missed weeks from the most recent unpaid installments backward.
 */
export function countTrailingConsecutiveMissedWeeks(weeks: readonly LoanScheduleWeek[]): number {
  let count = 0;

  for (let index = weeks.length - 1; index >= 0; index -= 1) {
    const week = weeks[index];

    if (week.status === SCHEDULE_WEEK_STATUS.MISSED) {
      count += 1;
      continue;
    }

    if (week.status === SCHEDULE_WEEK_STATUS.PAID) {
      break;
    }

    if (week.status === SCHEDULE_WEEK_STATUS.PENDING) {
      break;
    }
  }

  return count;
}

export function hasConsecutiveMissedWeeks(
  weeks: readonly LoanScheduleWeek[],
  minimum: number,
): boolean {
  let streak = 0;

  for (const week of weeks) {
    if (week.status === SCHEDULE_WEEK_STATUS.MISSED) {
      streak += 1;
      if (streak >= minimum) {
        return true;
      }
      continue;
    }

    if (week.status === SCHEDULE_WEEK_STATUS.PAID) {
      streak = 0;
    }
  }

  return false;
}

export function resolveEscalatedLoanStatus(weeks: readonly LoanScheduleWeek[]): LoanStatus | null {
  if (hasConsecutiveMissedWeeks(weeks, DEFAULTED_CONSECUTIVE_MISSED_THRESHOLD)) {
    return LOAN_STATUS.DEFAULTED;
  }

  return null;
}

/**
 * BRD §10.3 — 1 missed payment → At Risk; 2+ consecutive missed → Defaulted.
 */
export function resolveBorrowerRepaymentStatus(weeks: readonly LoanScheduleWeek[]): BorrowerStatus {
  if (hasConsecutiveMissedWeeks(weeks, DEFAULTED_CONSECUTIVE_MISSED_THRESHOLD)) {
    return BORROWER_STATUS.DEFAULTED;
  }

  if (countMissedWeeks(weeks) >= 1) {
    return BORROWER_STATUS.AT_RISK;
  }

  return BORROWER_STATUS.APPROVED;
}
