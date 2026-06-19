import { describe, expect, it } from 'vitest';
import { isPaymentEditable, isSameCalendarDay } from '@/utils/payment-same-day';

describe('payment-same-day', () => {
  it('detects same calendar day', () => {
    expect(isSameCalendarDay('2026-05-23T09:00:00.000Z', '2026-05-23T18:00:00.000Z')).toBe(true);
    expect(isSameCalendarDay('2026-05-23T09:00:00.000Z', '2026-05-24T09:00:00.000Z')).toBe(false);
  });

  it('allows edits only for payments recorded on the payment day', () => {
    expect(
      isPaymentEditable(
        '2026-05-23',
        '2026-05-23T09:00:00.000Z',
        '2026-05-23T18:00:00.000Z',
      ),
    ).toBe(true);

    expect(
      isPaymentEditable(
        '2026-05-22',
        '2026-05-22T09:00:00.000Z',
        '2026-05-23T09:00:00.000Z',
      ),
    ).toBe(false);
  });
});
