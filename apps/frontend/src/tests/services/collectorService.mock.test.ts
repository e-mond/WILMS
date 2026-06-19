import { beforeEach, describe, expect, it } from 'vitest';
import {
  COLLECTOR_PAYMENT_STATUS,
  RECONCILIATION_STATUS,
} from '@/types/collector-dashboard';
import collectorServiceMock from '@/services/mock/collectorService.mock';
import { resetMockBorrowerRegistrations } from '@/services/mock/borrowerService.mock';
import { resetMockLoans } from '@/services/mock/loanService.mock';
import { resetPaymentTransactions } from '@/services/mock/payment-transaction.store';
import { resetMockTransactions } from '@/services/mock/transactionService.mock';

describe('collectorService.mock dashboard', () => {
  beforeEach(() => {
    resetMockBorrowerRegistrations();
    resetMockTransactions();
    resetMockLoans();
    resetPaymentTransactions();
  });

  it('returns Friday borrowers with expected vs collected totals', async () => {
    const dashboard = await collectorServiceMock.getDashboard('user-collector', '2026-05-29');

    expect(dashboard.summary).toMatchObject({
      paymentDayLabel: 'Friday',
      borrowersDueCount: 2,
      expectedPesewas: 11000,
      collectedPesewas: 0,
      collectionRatePercent: 0,
      missedAlertsCount: 4,
    });
    expect(dashboard.borrowers[0]).toMatchObject({
      borrowerName: 'Ama Mensah',
      paymentStatus: COLLECTOR_PAYMENT_STATUS.MISSED,
    });
  });

  it('flags pending reconciliation for the current date', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const dashboard = await collectorServiceMock.getDashboard('user-collector', today);

    expect(dashboard.summary.reconciliationStatus).toBe(RECONCILIATION_STATUS.PENDING);
  });
});
