import { describe, expect, it } from 'vitest';
import { recalculatePendingDueDatesForPaymentDay } from '../../domain/loan/schedule.js';

describe('recalculatePendingDueDatesForPaymentDay', () => {
  it('shifts future pending weeks onto the new weekday and preserves paid history', () => {
    const result = recalculatePendingDueDatesForPaymentDay({
      weeks: [
        { weekNumber: 1, dueDate: '2026-08-07', status: 'PAID' },
        { weekNumber: 2, dueDate: '2026-08-14', status: 'PENDING' },
        { weekNumber: 3, dueDate: '2026-08-21', status: 'PENDING' },
      ],
      toPaymentDay: 'Wednesday',
      effectiveFrom: '2026-08-12',
    });

    expect(result).toEqual([
      { weekNumber: 2, dueDate: '2026-08-12' },
      { weekNumber: 3, dueDate: '2026-08-19' },
    ]);
  });

  it('returns an empty list when no pending weeks remain', () => {
    const result = recalculatePendingDueDatesForPaymentDay({
      weeks: [{ weekNumber: 1, dueDate: '2026-08-07', status: 'PAID' }],
      toPaymentDay: 'Friday',
      effectiveFrom: '2026-08-01',
    });
    expect(result).toEqual([]);
  });
});
