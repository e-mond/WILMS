import { describe, expect, it } from 'vitest';
import { adjustDueDateForHolidays } from '../../domain/loan/holiday-shift.js';
import { generateLoanScheduleWeeks } from '../../domain/loan/schedule.js';

describe('holiday-aware schedule shifting', () => {
  it('shifts a due date that falls on a holiday forward', () => {
    const holidays = new Set(['2026-03-06', '2026-03-07']);

    expect(adjustDueDateForHolidays('2026-03-06', holidays)).toBe('2026-03-08');
  });

  it('leaves non-holiday due dates unchanged', () => {
    const holidays = new Set(['2026-03-06']);

    expect(adjustDueDateForHolidays('2026-03-09', holidays)).toBe('2026-03-09');
  });

  it('applies holiday shifting when generating weekly schedules', () => {
    const schedule = generateLoanScheduleWeeks({
      durationWeeks: 2,
      weeklyPaymentPesewas: 5_000,
      startDate: '2026-03-02',
      paymentDay: 'Friday',
      holidayDates: ['2026-03-06'],
    });

    expect(schedule[0]?.dueDate).toBe('2026-03-07');
    expect(schedule[1]?.dueDate).toBe('2026-03-13');
  });
});
