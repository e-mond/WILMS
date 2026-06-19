export const OVERPAYMENT_REVIEW_STATUS = {
  PENDING: 'PENDING',
  RESOLVED: 'RESOLVED',
  DISMISSED: 'DISMISSED',
} as const;

export type OverpaymentReviewStatus =
  (typeof OVERPAYMENT_REVIEW_STATUS)[keyof typeof OVERPAYMENT_REVIEW_STATUS];

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
  status: OverpaymentReviewStatus;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
}

export interface OverpaymentReviewListResponse {
  generatedAt: string;
  pendingCount: number;
  reviews: OverpaymentReview[];
}

export interface ResolveOverpaymentReviewInput {
  action: 'RESOLVED' | 'DISMISSED';
  note?: string;
}

export interface QueueOverpaymentReviewInput {
  borrowerId: string;
  borrowerName: string;
  loanId: string;
  collectorId: string;
  paymentDate: string;
  attemptedAmountPesewas: number;
  expectedAmountPesewas: number;
}
