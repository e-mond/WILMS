import { describe, expect, it } from 'vitest';
import { SCHEDULE_WEEK_STATUS } from '@/types/loan-schedule';
import { generateLoanSchedule, getFirstDueDateIso } from '@/utils/loan-schedule';

describe('loan schedule generation', () => {
  it('aligns week 1 to the first payment day on or after the start date', () => {
    expect(getFirstDueDateIso('2026-06-10', 'Monday')).toBe('2026-06-15');
    expect(getFirstDueDateIso('2026-06-10', 'Wednesday')).toBe('2026-06-10');
  });

  it('generates week 1 through N with fixed weekly amounts', () => {
    const schedule = generateLoanSchedule({
      durationWeeks: 12,
      weeklyPaymentPesewas: 2500,
      startDate: '2026-06-10',
      paymentDay: 'Monday',
    });

    expect(schedule).toHaveLength(12);
    expect(schedule[0]).toMatchObject({
      weekNumber: 1,
      dueDate: '2026-06-15',
      amountPesewas: 2500,
      status: SCHEDULE_WEEK_STATUS.PENDING,
    });
    expect(schedule[11]).toMatchObject({
      weekNumber: 12,
      dueDate: '2026-08-31',
      amountPesewas: 2500,
      status: SCHEDULE_WEEK_STATUS.PENDING,
    });
  });
});
