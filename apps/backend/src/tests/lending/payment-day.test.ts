import { describe, expect, it } from 'vitest';
import { isValidPaymentDay, PAYMENT_DAY_OPTIONS } from '../../domain/loan/payment-day.js';
import { getFirstDueDateIso } from '../../domain/loan/schedule.js';

describe('payment day options', () => {
  it('includes Sunday through Saturday', () => {
    expect(PAYMENT_DAY_OPTIONS).toEqual([
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ]);
  });

  it('accepts Sunday as a valid payment day', () => {
    expect(isValidPaymentDay('Sunday')).toBe(true);
    expect(isValidPaymentDay('Funday')).toBe(false);
  });

  it('schedules the first due date on Sunday when requested', () => {
    expect(getFirstDueDateIso('2026-06-10', 'Sunday')).toBe('2026-06-14');
  });
});
