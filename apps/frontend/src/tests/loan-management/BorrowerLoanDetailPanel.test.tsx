import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import loanServiceMock, { resetMockLoans } from '@/services/mock/loanService.mock';
import { resetMockBorrowerRegistrations } from '@/services/mock/borrowerService.mock';
import { resetMockTransactions } from '@/services/mock/transactionService.mock';
import { TestQueryProvider } from '@/tests/utils/test-query-client';

const mockListBorrowerLoans = vi.hoisted(() => vi.fn());
const mockGetLoan = vi.hoisted(() => vi.fn());
const mockGetLoanSchedule = vi.hoisted(() => vi.fn());
const mockGetLoanProgress = vi.hoisted(() => vi.fn());
const mockListLoanPaymentLog = vi.hoisted(() => vi.fn());

vi.mock('@/services', () => ({
  loanService: {
    listBorrowerLoans: mockListBorrowerLoans,
    getLoan: mockGetLoan,
    getLoanSchedule: mockGetLoanSchedule,
    getLoanProgress: mockGetLoanProgress,
    listLoanPaymentLog: mockListLoanPaymentLog,
  },
}));

import { BorrowerLoanDetailPanel } from '@/features/loan-management/components/BorrowerLoanDetailPanel';

describe('BorrowerLoanDetailPanel', () => {
  beforeEach(() => {
    resetMockBorrowerRegistrations();
    resetMockTransactions();
    resetMockLoans();
    mockListBorrowerLoans.mockReset();
    mockGetLoan.mockReset();
    mockGetLoanSchedule.mockReset();
    mockGetLoanProgress.mockReset();
    mockListLoanPaymentLog.mockReset();
    mockListBorrowerLoans.mockImplementation((id: string) => loanServiceMock.listBorrowerLoans(id));
    mockGetLoan.mockImplementation((id: string) => loanServiceMock.getLoan(id));
    mockGetLoanSchedule.mockImplementation((id: string) => loanServiceMock.getLoanSchedule(id));
    mockGetLoanProgress.mockImplementation((id: string) => loanServiceMock.getLoanProgress(id));
    mockListLoanPaymentLog.mockImplementation((id: string) => loanServiceMock.listLoanPaymentLog(id));
  });

  it('renders progress metrics, schedule, and payment log', async () => {
    render(
      <TestQueryProvider>
        <BorrowerLoanDetailPanel borrowerId="borrower-001" loanId="loan-001" />
      </TestQueryProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'loan-001' })).toBeInTheDocument();
    expect(screen.getByText('Progress metrics')).toBeInTheDocument();
    expect(screen.getByText('Percent repaid')).toBeInTheDocument();
    expect(screen.getByText('GH₵150.00')).toBeInTheDocument();
    expect(screen.getByText('Weekly schedule')).toBeInTheDocument();
    expect(screen.getByText('Payment log')).toBeInTheDocument();
    expect(screen.getAllByText('Disbursement').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Repayment').length).toBeGreaterThan(0);
  });
});
