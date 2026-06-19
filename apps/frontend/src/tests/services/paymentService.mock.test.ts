import { beforeEach, describe, expect, it, vi } from 'vitest';
import { API_ERROR_CODE } from '@/types/api';
import paymentServiceMock, {
  resetMockPaymentTransactions,
} from '@/services/mock/paymentService.mock';
import { resetMockBorrowerRegistrations } from '@/services/mock/borrowerService.mock';
import { resetMockLoans } from '@/services/mock/loanService.mock';
import { resetMockTransactions } from '@/services/mock/transactionService.mock';
import { resetMockOverpaymentReviews } from '@/services/mock/overpaymentReviewService.mock';
import { getOverpaymentReviews } from '@/services/mock/overpayment-review.store';

const SAMPLE_GPS = {
  latitude: 5.61,
  longitude: -0.19,
  capturedAt: '2026-05-29T10:00:00.000Z',
};

describe('paymentService.mock', () => {
  beforeEach(() => {
    resetMockBorrowerRegistrations();
    resetMockTransactions();
    resetMockLoans();
    resetMockPaymentTransactions();
    resetMockOverpaymentReviews();
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('generated-payment-id');
  });

  it('records a payment with provided GPS coordinates', async () => {
    const transaction = await paymentServiceMock.recordPayment({
      borrowerId: 'borrower-001',
      amountPesewas: 5000,
      paymentDate: '2026-05-29',
      collectorId: 'user-collector',
      gps: SAMPLE_GPS,
    });

    expect(transaction).toMatchObject({
      id: 'generated-payment-id',
      borrowerId: 'borrower-001',
      amountPesewas: 5000,
      gps: {
        latitude: 5.61,
        longitude: -0.19,
      },
    });
  });

  it('blocks overpayments and queues a Super Admin review', async () => {
    await expect(
      paymentServiceMock.recordPayment({
        borrowerId: 'borrower-001',
        amountPesewas: 7500,
        paymentDate: '2026-05-29',
        collectorId: 'user-collector',
        gps: SAMPLE_GPS,
      }),
    ).rejects.toMatchObject({
      code: API_ERROR_CODE.OVERPAYMENT,
    });

    expect(
      getOverpaymentReviews().some(
        (review) =>
          review.borrowerId === 'borrower-001' &&
          review.attemptedAmountPesewas === 7500 &&
          review.expectedAmountPesewas === 5000,
      ),
    ).toBe(true);
  });

  it('blocks duplicate borrower + date + amount transactions', async () => {
    const payload = {
      borrowerId: 'borrower-001',
      amountPesewas: 5000,
      paymentDate: '2026-05-23',
      collectorId: 'user-collector',
      gps: SAMPLE_GPS,
    };

    await expect(paymentServiceMock.recordPayment(payload)).rejects.toMatchObject({
      code: API_ERROR_CODE.DUPLICATE_TRANSACTION,
    });
  });
});
