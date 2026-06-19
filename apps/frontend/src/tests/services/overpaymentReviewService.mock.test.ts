import { beforeEach, describe, expect, it } from 'vitest';
import { AUDIT_ACTION } from '@/constants/audit';
import { API_ERROR_CODE } from '@/types/api';
import overpaymentReviewServiceMock, {
  resetMockOverpaymentReviews,
} from '@/services/mock/overpaymentReviewService.mock';
import { getAuditEntries, resetAuditLog } from '@/services/mock/audit-log.store';
import { getOverpaymentReviews } from '@/services/mock/overpayment-review.store';
import { resetMockNotifications } from '@/services/mock/notificationService.mock';
import { OVERPAYMENT_REVIEW_STATUS } from '@/types/overpayment-review';

describe('overpaymentReviewService.mock', () => {
  beforeEach(() => {
    resetMockOverpaymentReviews();
    resetAuditLog();
    resetMockNotifications();
  });

  it('lists pending overpayment reviews', async () => {
    const response = await overpaymentReviewServiceMock.listPendingReviews();

    expect(response.pendingCount).toBeGreaterThan(0);
    expect(response.reviews.every((review) => review.status === OVERPAYMENT_REVIEW_STATUS.PENDING)).toBe(
      true,
    );
  });

  it('queues a new overpayment review with audit trail', async () => {
    const created = await overpaymentReviewServiceMock.queueReview({
      borrowerId: 'borrower-002',
      borrowerName: 'Efua Boateng',
      loanId: 'loan-pending-001',
      collectorId: 'user-collector',
      paymentDate: '2026-05-29',
      attemptedAmountPesewas: 7500,
      expectedAmountPesewas: 2500,
    });

    expect(created.status).toBe(OVERPAYMENT_REVIEW_STATUS.PENDING);
    expect(created.excessPesewas).toBe(5000);
    expect(
      getAuditEntries().some((entry) => entry.action === AUDIT_ACTION.OVERPAYMENT_FLAGGED),
    ).toBe(true);
    expect(
      (await overpaymentReviewServiceMock.listPendingReviews()).reviews.some(
        (review) => review.id === created.id,
      ),
    ).toBe(true);
  });

  it('resolves a pending overpayment review', async () => {
    const pending = (await overpaymentReviewServiceMock.listPendingReviews()).reviews[0];

    const resolved = await overpaymentReviewServiceMock.resolveReview(
      pending.id,
      { action: 'RESOLVED', note: 'Collector mistyped amount on device.' },
      'user-super-admin',
      'Super Admin',
    );

    expect(resolved.status).toBe(OVERPAYMENT_REVIEW_STATUS.RESOLVED);
    expect(
      getOverpaymentReviews().find((review) => review.id === pending.id)?.status,
    ).toBe(OVERPAYMENT_REVIEW_STATUS.RESOLVED);
    expect(
      getAuditEntries().some((entry) => entry.action === AUDIT_ACTION.OVERPAYMENT_REVIEWED),
    ).toBe(true);
  });

  it('rejects resolving a review that is not pending', async () => {
    const pending = (await overpaymentReviewServiceMock.listPendingReviews()).reviews[0];

    await overpaymentReviewServiceMock.resolveReview(
      pending.id,
      { action: 'DISMISSED' },
      'user-super-admin',
      'Super Admin',
    );

    await expect(
      overpaymentReviewServiceMock.resolveReview(
        pending.id,
        { action: 'RESOLVED' },
        'user-super-admin',
        'Super Admin',
      ),
    ).rejects.toMatchObject({
      code: API_ERROR_CODE.VALIDATION,
    });
  });
});
