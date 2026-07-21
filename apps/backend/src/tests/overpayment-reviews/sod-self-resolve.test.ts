import { describe, expect, it } from 'vitest';
import {
  queueReview,
  resolveReview,
  listPendingReviews,
} from '../../modules/overpayment-reviews/service.js';

describe('overpayment review SoD', () => {
  it('blocks the submitting collector from resolving their own review', () => {
    const review = queueReview({
      borrowerId: 'b1',
      borrowerName: 'Ada',
      loanId: 'loan-1',
      collectorId: 'collector-1',
      paymentDate: '2026-07-21',
      attemptedAmountPesewas: 6000,
      expectedAmountPesewas: 5000,
    });

    expect(() =>
      resolveReview(review.id, { action: 'RESOLVED' }, 'collector-1', 'Collector One'),
    ).toThrow(/FORBIDDEN:/);

    expect(listPendingReviews().pendingCount).toBe(1);
  });
});
