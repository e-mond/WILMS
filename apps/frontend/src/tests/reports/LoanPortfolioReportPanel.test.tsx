import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import reportServiceMock from '@/services/mock/reportService.mock';
import { resetMockBorrowerRegistrations } from '@/services/mock/borrowerService.mock';
import { resetMockLoans } from '@/services/mock/loanService.mock';
import { resetPaymentTransactions } from '@/services/mock/payment-transaction.store';
import { resetMockTransactions } from '@/services/mock/transactionService.mock';
import { TestQueryProvider } from '@/tests/utils/test-query-client';

const mockGetLoanPortfolioReport = vi.hoisted(() => vi.fn());

vi.mock('@/services', () => ({
  reportService: {
    getLoanPortfolioReport: mockGetLoanPortfolioReport,
  },
}));

import { LoanPortfolioReportPanel } from '@/features/reports/components/LoanPortfolioReportPanel';

describe('LoanPortfolioReportPanel', () => {
  beforeEach(() => {
    resetMockBorrowerRegistrations();
    resetMockTransactions();
    resetMockLoans();
    resetPaymentTransactions();
    mockGetLoanPortfolioReport.mockReset();
    mockGetLoanPortfolioReport.mockImplementation((params) =>
      reportServiceMock.getLoanPortfolioReport(params),
    );
  });

  it('renders portfolio report summary and export action', async () => {
    render(
      <TestQueryProvider>
        <LoanPortfolioReportPanel />
      </TestQueryProvider>,
    );

    expect(await screen.findByText('Total Disbursed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
    expect(screen.getByText('Ama Mensah')).toBeInTheDocument();
  });
});
