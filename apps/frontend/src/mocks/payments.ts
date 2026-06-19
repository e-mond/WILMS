import { PAYMENT_TRANSACTION_STATUS, type PaymentTransaction } from '@/types/payment';

export const MOCK_PAYMENT_TRANSACTIONS: PaymentTransaction[] = [
  {
    id: 'payment-001',
    borrowerId: 'borrower-001',
    amountPesewas: 5000,
    paymentDate: '2026-05-23',
    gps: {
      latitude: 5.6037,
      longitude: -0.187,
      capturedAt: '2026-05-23T09:30:00.000Z',
    },
    collectorId: 'user-collector',
    recordedAt: '2026-05-23T09:30:05.000Z',
    status: PAYMENT_TRANSACTION_STATUS.CONFIRMED,
  },
];
