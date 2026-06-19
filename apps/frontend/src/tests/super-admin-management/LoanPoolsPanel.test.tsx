import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import loanPoolServiceMock from '@/services/mock/loanPoolService.mock';
import { TestQueryProvider } from '@/tests/utils/test-query-client';

const mockListLoanPools = vi.hoisted(() => vi.fn());

vi.mock('@/services', () => ({
  loanPoolService: {
    listLoanPools: mockListLoanPools,
  },
}));

import { LoanPoolsPanel } from '@/features/loan-pools/components/LoanPoolsPanel';

describe('LoanPoolsPanel', () => {
  beforeEach(() => {
    mockListLoanPools.mockReset();
    mockListLoanPools.mockImplementation(() => loanPoolServiceMock.listLoanPools());
  });

  it('renders loan pool summary and table', async () => {
    render(
      <TestQueryProvider>
        <LoanPoolsPanel />
      </TestQueryProvider>,
    );

    expect(await screen.findByText('Total Pool Funds')).toBeInTheDocument();
    expect(screen.getAllByText('Accra Metro Pool').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
  });
});
