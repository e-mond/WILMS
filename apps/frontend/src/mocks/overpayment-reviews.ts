import {
  OVERPAYMENT_REVIEW_STATUS,
  type OverpaymentReview,
} from '@/types/overpayment-review';

export const MOCK_OVERPAYMENT_REVIEWS: OverpaymentReview[] = [
  {
    id: 'ovp-001',
    borrowerId: 'borrower-001',
    borrowerName: 'Ama Mensah',
    loanId: 'loan-001',
    collectorId: 'user-collector',
    paymentDate: '2026-05-22',
    attemptedAmountPesewas: 10_000,
    expectedAmountPesewas: 5000,
    excessPesewas: 5000,
    flaggedAt: '2026-05-22T14:20:00.000Z',
    status: OVERPAYMENT_REVIEW_STATUS.PENDING,
  },
];
