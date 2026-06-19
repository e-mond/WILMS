import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import reportServiceMock from '@/services/mock/reportService.mock';
import { resetMockBorrowerRegistrations } from '@/services/mock/borrowerService.mock';
import { resetMockLoans } from '@/services/mock/loanService.mock';
import { resetPaymentTransactions } from '@/services/mock/payment-transaction.store';
import { resetMockTransactions } from '@/services/mock/transactionService.mock';
import { TestQueryProvider } from '@/tests/utils/test-query-client';

const mockGetDailyCollectionReport = vi.hoisted(() => vi.fn());

vi.mock('@/services', () => ({
  reportService: {
    getDailyCollectionReport: mockGetDailyCollectionReport,
  },
}));

import { DailyCollectionReportPanel } from '@/features/reports/components/DailyCollectionReportPanel';

describe('DailyCollectionReportPanel', () => {
  beforeEach(() => {
    resetMockBorrowerRegistrations();
    resetMockTransactions();
    resetMockLoans();
    resetPaymentTransactions();
    mockGetDailyCollectionReport.mockReset();
    mockGetDailyCollectionReport.mockImplementation((params) =>
      reportServiceMock.getDailyCollectionReport(params),
    );
  });

  it('renders daily collection totals and borrower rows', async () => {
    render(
      <TestQueryProvider>
        <DailyCollectionReportPanel />
      </TestQueryProvider>,
    );

    expect(
      await screen.findByRole('table', { name: 'Daily collection report' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Expected Collections')).toBeInTheDocument();
    expect(screen.getAllByText('Collected').length).toBeGreaterThan(0);
    expect(screen.getByText('Ama Mensah')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
  });
});
