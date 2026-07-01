import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import borrowerServiceMock, { resetMockBorrowerRegistrations } from '@/services/mock/borrowerService.mock';
import loanServiceMock, { resetMockLoans } from '@/services/mock/loanService.mock';
import { resetMockTransactions } from '@/services/mock/transactionService.mock';
import { TestQueryProvider } from '@/tests/utils/test-query-client';

const mockGetBorrowerFullProfile = vi.hoisted(() => vi.fn());
const mockListBorrowerLoans = vi.hoisted(() => vi.fn());
const mockGetLoanSchedule = vi.hoisted(() => vi.fn());
const mockGetLoanProgress = vi.hoisted(() => vi.fn());
const mockListLoanPaymentLog = vi.hoisted(() => vi.fn());

vi.mock('@/services', () => ({
  borrowerService: {
    getBorrowerFullProfile: mockGetBorrowerFullProfile,
  },
  loanService: {
    listBorrowerLoans: mockListBorrowerLoans,
    getLoanSchedule: mockGetLoanSchedule,
    getLoanProgress: mockGetLoanProgress,
    listLoanPaymentLog: mockListLoanPaymentLog,
  },
}));

import { BorrowerProfilePanel } from '@/features/borrower-management/components/BorrowerProfilePanel';

describe('BorrowerProfilePanel', () => {
  beforeEach(() => {
    resetMockBorrowerRegistrations();
    resetMockTransactions();
    resetMockLoans();
    mockGetBorrowerFullProfile.mockReset();
    mockListBorrowerLoans.mockReset();
    mockGetLoanSchedule.mockReset();
    mockGetLoanProgress.mockReset();
    mockListLoanPaymentLog.mockReset();
    mockGetBorrowerFullProfile.mockImplementation((id: string) =>
      borrowerServiceMock.getBorrowerFullProfile(id),
    );
    mockListBorrowerLoans.mockImplementation((id: string) => loanServiceMock.listBorrowerLoans(id));
    mockGetLoanSchedule.mockImplementation((loanId: string) => loanServiceMock.getLoanSchedule(loanId));
    mockGetLoanProgress.mockImplementation((loanId: string) => loanServiceMock.getLoanProgress(loanId));
    mockListLoanPaymentLog.mockImplementation((loanId: string) =>
      loanServiceMock.listLoanPaymentLog(loanId),
    );
  });

  it('renders full borrower profile sections and loan history', async () => {
    render(
      <TestQueryProvider>
        <BorrowerProfilePanel borrowerId="borrower-001" />
      </TestQueryProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Ama Mensah' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Personal Information' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Loan Information' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Payment History' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Risk Information' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open loan' })).toHaveAttribute(
      'href',
      '/borrowers/borrower-001/loan?loanId=loan-001',
    );
  });

  it('renders risk section when API omits risk payload', async () => {
    mockGetBorrowerFullProfile.mockResolvedValue({
      id: 'borrower-no-risk',
      fullName: 'No Risk Borrower',
      phone: '+233200000099',
      status: 'APPROVED',
      groupName: 'Test Group',
      groupId: 'group-001',
      nationalId: 'GHA-000',
      community: 'Accra',
      registeredAt: '2025-01-01T00:00:00.000Z',
    });
    mockListBorrowerLoans.mockResolvedValue([]);

    render(
      <TestQueryProvider>
        <BorrowerProfilePanel borrowerId="borrower-no-risk" />
      </TestQueryProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'No Risk Borrower' })).toBeInTheDocument();
    expect(screen.getAllByText('Low Risk').length).toBeGreaterThan(0);
    expect(mockGetLoanSchedule).not.toHaveBeenCalled();
  });
});
