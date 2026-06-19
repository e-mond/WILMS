import { describe, expect, it } from 'vitest';
import { SCHEDULE_WEEK_STATUS, type LoanScheduleWeek } from '@/types/loan-schedule';
import { LOAN_STATUS } from '@/types/loan';
import { BORROWER_STATUS } from '@/types/borrower';
import {
  countTrailingConsecutiveMissedWeeks,
  resolveBorrowerRepaymentStatus,
  resolveEscalatedLoanStatus,
} from '@/utils/defaulter-escalation';

function week(status: LoanScheduleWeek['status']): LoanScheduleWeek {
  return {
    weekNumber: 1,
    dueDate: '2026-05-01',
    amountPesewas: 5000,
    status,
  };
}

describe('defaulter-escalation', () => {
  it('counts trailing consecutive missed weeks', () => {
    const weeks = [
      week(SCHEDULE_WEEK_STATUS.PAID),
      week(SCHEDULE_WEEK_STATUS.MISSED),
      week(SCHEDULE_WEEK_STATUS.MISSED),
    ];

    expect(countTrailingConsecutiveMissedWeeks(weeks)).toBe(2);
  });

  it('escalates to defaulted after two consecutive missed weeks', () => {
    const weeks = [
      week(SCHEDULE_WEEK_STATUS.PAID),
      week(SCHEDULE_WEEK_STATUS.MISSED),
      week(SCHEDULE_WEEK_STATUS.MISSED),
    ];

    expect(resolveEscalatedLoanStatus(weeks)).toBe(LOAN_STATUS.DEFAULTED);
  });

  it('does not escalate after a single missed week', () => {
    const weeks = [week(SCHEDULE_WEEK_STATUS.PAID), week(SCHEDULE_WEEK_STATUS.MISSED)];

    expect(resolveEscalatedLoanStatus(weeks)).toBeNull();
  });

  it('marks borrower at risk after one missed week', () => {
    const weeks = [week(SCHEDULE_WEEK_STATUS.PAID), week(SCHEDULE_WEEK_STATUS.MISSED)];

    expect(resolveBorrowerRepaymentStatus(weeks)).toBe(BORROWER_STATUS.AT_RISK);
  });

  it('marks borrower defaulted after two consecutive missed weeks', () => {
    const weeks = [
      week(SCHEDULE_WEEK_STATUS.PAID),
      week(SCHEDULE_WEEK_STATUS.MISSED),
      week(SCHEDULE_WEEK_STATUS.MISSED),
    ];

    expect(resolveBorrowerRepaymentStatus(weeks)).toBe(BORROWER_STATUS.DEFAULTED);
  });

  it('returns active when no missed weeks remain', () => {
    const weeks = [
      week(SCHEDULE_WEEK_STATUS.PAID),
      week(SCHEDULE_WEEK_STATUS.PAID),
      week(SCHEDULE_WEEK_STATUS.PENDING),
    ];

    expect(resolveBorrowerRepaymentStatus(weeks)).toBe(BORROWER_STATUS.APPROVED);
  });
});
