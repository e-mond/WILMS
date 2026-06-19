import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { USER_ROLE } from '@/constants/roles';
import { resetMockBorrowerRegistrations } from '@/services/mock/borrowerService.mock';
import loanServiceMock from '@/services/mock/loanService.mock';
import transactionServiceMock, { resetMockTransactions } from '@/services/mock/transactionService.mock';
import { useAuthStore } from '@/state/authStore';
import { TestQueryProvider } from '@/tests/utils/test-query-client';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

const mockRecordAdminFee = vi.hoisted(() => vi.fn());
const mockGetAdminFeeStatus = vi.hoisted(() => vi.fn());
const mockGetDisbursementEligibility = vi.hoisted(() => vi.fn());

vi.mock('@/services', () => ({
  transactionService: {
    recordAdminFee: mockRecordAdminFee,
    getAdminFeeStatus: mockGetAdminFeeStatus,
    listBorrowersAwaitingAdminFee: vi.fn(),
  },
  loanService: {
    getDisbursementEligibility: mockGetDisbursementEligibility,
  },
}));

import { AdminFeeRecordingPanel } from '@/features/admin-fee/components/AdminFeeRecordingPanel';

function renderPanel(borrowerId = 'borrower-002') {
  return render(
    <TestQueryProvider>
      <AdminFeeRecordingPanel borrowerId={borrowerId} />
    </TestQueryProvider>,
  );
}

describe('AdminFeeRecordingPanel', () => {
  beforeEach(() => {
    resetMockBorrowerRegistrations();
    resetMockTransactions();
    useAuthStore.setState({
      user: {
        id: 'user-collector',
        role: USER_ROLE.COLLECTOR,
        displayName: 'Field Collector',
      },
      expiresAt: Date.now() + 60_000,
      isHydrated: true,
      isExpired: false,
    });
    mockRecordAdminFee.mockReset();
    mockGetAdminFeeStatus.mockReset();
    mockGetDisbursementEligibility.mockReset();
    mockGetAdminFeeStatus.mockImplementation((borrowerId: string) =>
      transactionServiceMock.getAdminFeeStatus(borrowerId),
    );
    mockGetDisbursementEligibility.mockImplementation((borrowerId: string) =>
      loanServiceMock.getDisbursementEligibility(borrowerId),
    );
    mockRecordAdminFee.mockImplementation((input: { borrowerId: string; collectorId: string }) =>
      transactionServiceMock.recordAdminFee(input),
    );
  });

  it('shows the disbursement gate before the fee is recorded', async () => {
    renderPanel();

    expect(await screen.findByRole('heading', { name: 'Efua Boateng' })).toBeInTheDocument();
    expect(await screen.findByText('Disbursement blocked')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Record admin fee' })).toBeInTheDocument();
  });

  it('records the admin fee and unlocks disbursement', async () => {
    const user = userEvent.setup();
    renderPanel();

    await screen.findByRole('button', { name: 'Record admin fee' });
    await user.click(screen.getByRole('button', { name: 'Record admin fee' }));
    await user.click(screen.getByRole('button', { name: 'Confirm admin fee recording' }));

    await waitFor(() => {
      expect(mockRecordAdminFee).toHaveBeenCalledWith({
        borrowerId: 'borrower-002',
        collectorId: 'user-collector',
      });
      expect(screen.getByText('Admin fee recorded')).toBeInTheDocument();
      expect(screen.getByText('Disbursement unlocked')).toBeInTheDocument();
    });
  });
});
