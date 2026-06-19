import { beforeEach, describe, expect, it, vi } from 'vitest';
import { API_ERROR_CODE } from '@/types/api';
import { SCHEDULE_WEEK_STATUS } from '@/types/loan-schedule';
import paymentServiceMock, { resetMockPaymentTransactions } from '@/services/mock/paymentService.mock';
import { resetMockBorrowerRegistrations } from '@/services/mock/borrowerService.mock';
import { resetMockLoans } from '@/services/mock/loanService.mock';
import { resetMockTransactions } from '@/services/mock/transactionService.mock';
import { getStoredLoanSchedule } from '@/services/mock/loan-schedule.store';

const SAMPLE_GPS = {
  latitude: 5.6037,
  longitude: -0.187,
  capturedAt: '2026-05-29T10:00:00.000Z',
};

describe('paymentService.mock payment entry', () => {
  beforeEach(() => {
    resetMockBorrowerRegistrations();
    resetMockTransactions();
    resetMockLoans();
    resetMockPaymentTransactions();
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('generated-payment-id');
  });

  it('returns payment entry context for an active loan', async () => {
    const context = await paymentServiceMock.getPaymentEntryContext('borrower-001', '2026-05-29');

    expect(context).toMatchObject({
      borrowerName: 'Ama Mensah',
      loanId: 'loan-001',
      paymentDay: 'Friday',
      requiredAmountPesewas: 5000,
      canAcceptPayment: true,
      oldestObligation: {
        weekNumber: 4,
      },
    });
  });

  it('records a payment on the payment day and clears the oldest obligation', async () => {
    await paymentServiceMock.recordPayment({
      borrowerId: 'borrower-001',
      amountPesewas: 5000,
      paymentDate: '2026-05-29',
      collectorId: 'user-collector',
      gps: SAMPLE_GPS,
    });

    const schedule = getStoredLoanSchedule('loan-001');
    expect(schedule?.[3]?.status).toBe(SCHEDULE_WEEK_STATUS.PAID);
  });

  it('blocks partial payments and wrong-day submissions', async () => {
    await expect(
      paymentServiceMock.recordPayment({
        borrowerId: 'borrower-001',
        amountPesewas: 2500,
        paymentDate: '2026-05-29',
        collectorId: 'user-collector',
        gps: SAMPLE_GPS,
      }),
    ).rejects.toMatchObject({ code: API_ERROR_CODE.VALIDATION });

    await expect(
      paymentServiceMock.recordPayment({
        borrowerId: 'borrower-001',
        amountPesewas: 5000,
        paymentDate: '2026-05-30',
        collectorId: 'user-collector',
        gps: SAMPLE_GPS,
      }),
    ).rejects.toMatchObject({ code: API_ERROR_CODE.VALIDATION });
  });
});
