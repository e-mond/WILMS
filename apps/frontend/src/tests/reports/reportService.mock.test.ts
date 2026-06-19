import { beforeEach, describe, expect, it } from 'vitest';
import { resetMockBorrowerRegistrations } from '@/services/mock/borrowerService.mock';
import { resetMockLoans } from '@/services/mock/loanService.mock';
import reportServiceMock from '@/services/mock/reportService.mock';
import { resetPaymentTransactions } from '@/services/mock/payment-transaction.store';
import { resetMockTransactions } from '@/services/mock/transactionService.mock';

describe('reportService.mock', () => {
  beforeEach(() => {
    resetMockBorrowerRegistrations();
    resetMockTransactions();
    resetMockLoans();
    resetPaymentTransactions();
  });

  it('returns loan portfolio report from seed loans', async () => {
    const report = await reportServiceMock.getLoanPortfolioReport();

    expect(report.entries.length).toBeGreaterThan(0);
    expect(report.summary.totalLoans).toBe(report.entries.length);
    expect(report.summary.totalDisbursedPesewas).toBeGreaterThan(0);
  });

  it('returns daily collection report for a date with repayments', async () => {
    const report = await reportServiceMock.getDailyCollectionReport({ date: '2026-05-23' });

    expect(report.summary.collectedPesewas).toBe(5000);
    expect(report.rows.some((row) => row.borrowerName === 'Ama Mensah')).toBe(true);
  });
});
