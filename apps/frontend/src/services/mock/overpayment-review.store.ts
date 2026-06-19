import { MOCK_OVERPAYMENT_REVIEWS } from '@/mocks/overpayment-reviews';
import {
  OVERPAYMENT_REVIEW_STATUS,
  type OverpaymentReview,
  type OverpaymentReviewStatus,
  type QueueOverpaymentReviewInput,
} from '@/types/overpayment-review';

let overpaymentReviews: OverpaymentReview[] = [...MOCK_OVERPAYMENT_REVIEWS];

function nextOverpaymentReviewId(): string {
  const numericIds = overpaymentReviews
    .map((review) => Number.parseInt(review.id.replace('ovp-', ''), 10))
    .filter((value) => !Number.isNaN(value));
  const next = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;

  return `ovp-${String(next).padStart(3, '0')}`;
}

export function getOverpaymentReviews(): OverpaymentReview[] {
  return overpaymentReviews;
}

export function getOverpaymentReview(id: string): OverpaymentReview | undefined {
  return overpaymentReviews.find((review) => review.id === id);
}

export function appendOverpaymentReview(input: QueueOverpaymentReviewInput): OverpaymentReview {
  const duplicate = overpaymentReviews.find(
    (review) =>
      review.status === OVERPAYMENT_REVIEW_STATUS.PENDING &&
      review.borrowerId === input.borrowerId &&
      review.paymentDate === input.paymentDate &&
      review.attemptedAmountPesewas === input.attemptedAmountPesewas,
  );

  if (duplicate) {
    return duplicate;
  }

  const review: OverpaymentReview = {
    id: nextOverpaymentReviewId(),
    ...input,
    excessPesewas: input.attemptedAmountPesewas - input.expectedAmountPesewas,
    flaggedAt: new Date().toISOString(),
    status: OVERPAYMENT_REVIEW_STATUS.PENDING,
  };

  overpaymentReviews = [...overpaymentReviews, review];
  return review;
}

export function updateOverpaymentReviewStatus(
  id: string,
  status: OverpaymentReviewStatus,
  resolvedBy: string,
  resolutionNote?: string,
): OverpaymentReview {
  const existing = overpaymentReviews.find((review) => review.id === id);

  if (!existing) {
    throw new Error('Overpayment review not found.');
  }

  const updated: OverpaymentReview = {
    ...existing,
    status,
    resolvedAt: new Date().toISOString(),
    resolvedBy,
    resolutionNote: resolutionNote?.trim() || undefined,
  };

  overpaymentReviews = overpaymentReviews.map((review) => (review.id === id ? updated : review));
  return updated;
}

export function resetOverpaymentReviews(): void {
  overpaymentReviews = [...MOCK_OVERPAYMENT_REVIEWS];
}
