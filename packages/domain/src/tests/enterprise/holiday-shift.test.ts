import { describe, expect, it } from 'vitest';
import { adjustDueDateForHolidays, normalizeHolidayDates } from '../../domain/loan/holiday-shift.js';

describe('holiday schedule shift', () => {
  it('shifts due dates forward past consecutive holidays', () => {
    const holidays = normalizeHolidayDates(['2026-03-06', '2026-03-07']);
    expect(adjustDueDateForHolidays('2026-03-06', holidays)).toBe('2026-03-08');
  });

  it('leaves non-holiday dates unchanged', () => {
    const holidays = normalizeHolidayDates(['2026-03-06']);
    expect(adjustDueDateForHolidays('2026-03-05', holidays)).toBe('2026-03-05');
  });
});
