import { uuidv7 } from 'uuidv7';

export interface OverpaymentReview {
  id: string;
  borrowerId: string;
  borrowerName: string;
  loanId: string;
  collectorId: string;
  paymentDate: string;
  attemptedAmountPesewas: number;
  expectedAmountPesewas: number;
  excessPesewas: number;
  flaggedAt: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
}

export interface OverpaymentReviewListResponse {
  generatedAt: string;
  pendingCount: number;
  reviews: OverpaymentReview[];
}

const reviews: OverpaymentReview[] = [];

export function listPendingReviews(): OverpaymentReviewListResponse {
  const pending = reviews.filter((review) => review.status === 'PENDING');
  return {
    generatedAt: new Date().toISOString(),
    pendingCount: pending.length,
    reviews: pending.map((review) => ({ ...review })),
  };
}

export function queueReview(input: {
  borrowerId: string;
  borrowerName: string;
  loanId: string;
  collectorId: string;
  paymentDate: string;
  attemptedAmountPesewas: number;
  expectedAmountPesewas: number;
}): OverpaymentReview {
  const review: OverpaymentReview = {
    id: uuidv7(),
    borrowerId: input.borrowerId,
    borrowerName: input.borrowerName,
    loanId: input.loanId,
    collectorId: input.collectorId,
    paymentDate: input.paymentDate,
    attemptedAmountPesewas: input.attemptedAmountPesewas,
    expectedAmountPesewas: input.expectedAmountPesewas,
    excessPesewas: input.attemptedAmountPesewas - input.expectedAmountPesewas,
    flaggedAt: new Date().toISOString(),
    status: 'PENDING',
  };

  reviews.unshift(review);
  return { ...review };
}

export function resolveReview(
  id: string,
  input: { action: 'RESOLVED' | 'DISMISSED'; note?: string },
  actorDisplayName: string,
): OverpaymentReview {
  const index = reviews.findIndex((review) => review.id === id);
  if (index === -1) {
    throw new Error('NOT_FOUND');
  }

  const current = reviews[index]!;
  if (current.status !== 'PENDING') {
    throw new Error('VALIDATION:Only pending overpayment reviews can be resolved.');
  }

  const status = input.action === 'RESOLVED' ? 'RESOLVED' : 'DISMISSED';
  const updated: OverpaymentReview = {
    ...current,
    status,
    resolvedAt: new Date().toISOString(),
    resolvedBy: actorDisplayName,
    resolutionNote: input.note,
  };

  reviews[index] = updated;
  return { ...updated };
}
