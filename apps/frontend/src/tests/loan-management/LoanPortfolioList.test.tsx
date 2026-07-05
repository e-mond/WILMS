import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import loanServiceMock, { resetMockLoans } from '@/services/mock/loanService.mock';
import { resetMockBorrowerRegistrations } from '@/services/mock/borrowerService.mock';
import { resetMockTransactions } from '@/services/mock/transactionService.mock';
import { TestQueryProvider } from '@/tests/utils/test-query-client';
const mockListPortfolioEntries = vi.hoisted(() => vi.fn());

vi.mock('@/services', () => ({
  loanService: {
    listPortfolioEntries: mockListPortfolioEntries,
  },
}));

import { LoanPortfolioList } from '@/features/loan-management/components/LoanPortfolioList';

describe('LoanPortfolioList', () => {
  beforeEach(() => {
    resetMockBorrowerRegistrations();
    resetMockTransactions();
    resetMockLoans();
    mockListPortfolioEntries.mockReset();
    mockListPortfolioEntries.mockImplementation(() => loanServiceMock.listPortfolioEntries());
  });

  it('renders portfolio summary cards and outstanding balances', async () => {
    render(
      <TestQueryProvider>
        <LoanPortfolioList />
      </TestQueryProvider>,
    );

    expect(await screen.findByText('Total Outstanding')).toBeInTheDocument();
    expect(screen.getByText('Ama Mensah')).toBeInTheDocument();
    expect(screen.getAllByText('GH₵350.00').length).toBeGreaterThan(0);
  });

  it('filters the portfolio by loan status', async () => {
    const user = userEvent.setup();
    render(
      <TestQueryProvider>
        <LoanPortfolioList />
      </TestQueryProvider>,
    );

    await screen.findByText('Ama Mensah');
    await user.selectOptions(screen.getByLabelText('Filter by loan status'), 'COMPLETED');

    expect(await screen.findByText('Ama Mensan')).toBeInTheDocument();
    expect(screen.queryByText('Ama Mensah')).not.toBeInTheDocument();
    expect(screen.getByText(/Showing 1 of \d+ loans/)).toBeInTheDocument();
  });
});
