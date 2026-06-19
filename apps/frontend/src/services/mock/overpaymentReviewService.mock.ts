import { AUDIT_ACTION, AUDIT_TARGET_ENTITY } from '@/constants/audit';
import { API_ERROR_CODE, ApiError } from '@/types/api';
import {
  OVERPAYMENT_REVIEW_STATUS,
  type OverpaymentReviewListResponse,
  type QueueOverpaymentReviewInput,
  type ResolveOverpaymentReviewInput,
} from '@/types/overpayment-review';
import type { IOverpaymentReviewService } from '@/types/services';
import auditServiceMock from '@/services/mock/auditService.mock';
import { simulateDelay } from '@/services/mock/delay';
import notificationServiceMock from '@/services/mock/notificationService.mock';
import {
  appendOverpaymentReview,
  getOverpaymentReview,
  getOverpaymentReviews,
  resetOverpaymentReviews,
  updateOverpaymentReviewStatus,
} from '@/services/mock/overpayment-review.store';
import { NOTIFICATION_CHANNEL, NOTIFICATION_EVENT } from '@/types/notification';

function assertPendingReview(id: string) {
  const review = getOverpaymentReview(id);

  if (!review) {
    throw new ApiError('Overpayment review not found.', API_ERROR_CODE.NOT_FOUND, 404);
  }

  if (review.status !== OVERPAYMENT_REVIEW_STATUS.PENDING) {
    throw new ApiError('Only pending overpayment reviews can be resolved.', API_ERROR_CODE.VALIDATION, 422);
  }

  return review;
}

const overpaymentReviewServiceMock: IOverpaymentReviewService = {
  async listPendingReviews(): Promise<OverpaymentReviewListResponse> {
    await simulateDelay();

    const reviews = getOverpaymentReviews().filter(
      (review) => review.status === OVERPAYMENT_REVIEW_STATUS.PENDING,
    );

    return {
      generatedAt: new Date().toISOString(),
      pendingCount: reviews.length,
      reviews,
    };
  },

  async queueReview(input: QueueOverpaymentReviewInput) {
    await simulateDelay();

    const review = appendOverpaymentReview(input);

    await auditServiceMock.createEntry({
      action: AUDIT_ACTION.OVERPAYMENT_FLAGGED,
      actorId: input.collectorId,
      targetEntityId: review.id,
      targetEntityType: AUDIT_TARGET_ENTITY.OVERPAYMENT_REVIEW,
      reason: `Attempted ${input.attemptedAmountPesewas} pesewas; expected ${input.expectedAmountPesewas}.`,
    });

    await notificationServiceMock.sendSupervisorAlert({
      message: `Overpayment blocked for ${input.borrowerName} on ${input.paymentDate}. Super Admin review required.`,
      collectorId: input.collectorId,
      paymentId: `overpayment-${review.id}`,
    });

    return review;
  },

  async resolveReview(
    id: string,
    input: ResolveOverpaymentReviewInput,
    actorId: string,
    actorDisplayName: string,
  ) {
    await simulateDelay();
    const review = assertPendingReview(id);
    const status =
      input.action === 'RESOLVED'
        ? OVERPAYMENT_REVIEW_STATUS.RESOLVED
        : OVERPAYMENT_REVIEW_STATUS.DISMISSED;
    const updated = updateOverpaymentReviewStatus(id, status, actorDisplayName, input.note);

    await auditServiceMock.createEntry({
      action: AUDIT_ACTION.OVERPAYMENT_REVIEWED,
      actorId,
      actorDisplayName,
      targetEntityId: id,
      targetEntityType: AUDIT_TARGET_ENTITY.OVERPAYMENT_REVIEW,
      reason: input.note ?? `${input.action} overpayment review for ${review.borrowerName}`,
    });

    await notificationServiceMock.sendNotification({
      event: NOTIFICATION_EVENT.SUPERVISOR_ALERT,
      channels: [NOTIFICATION_CHANNEL.SMS],
      message: `WILMS: Overpayment review ${id} marked ${status.toLowerCase()} by ${actorDisplayName}.`,
      borrowerId: review.borrowerId,
      loanId: review.loanId,
    });

    return updated;
  },
};

export function resetMockOverpaymentReviews(): void {
  resetOverpaymentReviews();
}

export default overpaymentReviewServiceMock;
