import { describe, expect, it } from 'vitest';
import { markMissedPaymentSchema } from '../../modules/payments/service.js';

describe('markMissedPaymentSchema', () => {
  it('requires borrowerId, paymentDate, and collectorId', () => {
    const parsed = markMissedPaymentSchema.parse({
      borrowerId: 'borrower-1',
      paymentDate: '2026-08-04',
      collectorId: 'collector-1',
    });

    expect(parsed).toEqual({
      borrowerId: 'borrower-1',
      paymentDate: '2026-08-04',
      collectorId: 'collector-1',
    });
  });

  it('rejects invalid payment dates', () => {
    expect(() =>
      markMissedPaymentSchema.parse({
        borrowerId: 'borrower-1',
        paymentDate: '04-08-2026',
        collectorId: 'collector-1',
      }),
    ).toThrow();
  });
});
