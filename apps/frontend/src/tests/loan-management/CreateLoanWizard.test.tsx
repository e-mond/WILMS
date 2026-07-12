import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import loanServiceMock, { resetMockLoans } from '@/services/mock/loanService.mock';
import { resetMockBorrowerRegistrations } from '@/services/mock/borrowerService.mock';
import { resetMockTransactions } from '@/services/mock/transactionService.mock';
import { TestQueryProvider } from '@/tests/utils/test-query-client';

const push = vi.fn();
const mockListEligibleBorrowers = vi.hoisted(() => vi.fn());
const mockCreateLoan = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/services', () => ({
  loanService: {
    listEligibleBorrowers: mockListEligibleBorrowers,
    createLoan: mockCreateLoan,
  },
}));

import { CreateLoanWizard } from '@/features/loan-management/components/CreateLoanWizard';

function renderWizard() {
  return render(
    <TestQueryProvider>
      <CreateLoanWizard />
    </TestQueryProvider>,
  );
}

describe.sequential('CreateLoanWizard', () => {
  beforeEach(() => {
    resetMockBorrowerRegistrations();
    resetMockTransactions();
    resetMockLoans();
    push.mockReset();
    mockListEligibleBorrowers.mockReset();
    mockCreateLoan.mockReset();
    mockListEligibleBorrowers.mockImplementation(() => loanServiceMock.listEligibleBorrowers());
    mockCreateLoan.mockImplementation((input) => loanServiceMock.createLoan(input));
  });

  it('shows the preview step with computed weekly payment before submission', async () => {
    const user = userEvent.setup({ delay: null });
    renderWizard();

    await screen.findByLabelText(/Borrower/);
    await user.selectOptions(screen.getByLabelText(/Borrower/), 'borrower-003');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await user.clear(screen.getByLabelText(/Loan amount/));
    await user.type(screen.getByLabelText(/Loan amount/), '300');
    await user.clear(screen.getByLabelText(/Duration/));
    await user.type(screen.getByLabelText(/Duration/), '12');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await user.selectOptions(screen.getByLabelText(/Payment day/), 'Monday');
    await user.type(screen.getByLabelText(/Cycle/), 'Cycle 2 — April 2026');
    await user.type(screen.getByLabelText(/Start date/), '2026-06-10');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByRole('heading', { name: 'Review loan' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Schedule preview' })).toBeInTheDocument();
    expect(screen.getByText('Week 1')).toBeInTheDocument();
    expect(screen.getByText('Ama Mensan')).toBeInTheDocument();
    expect(screen.getByText('GH₵300.00')).toBeInTheDocument();
    expect(screen.getAllByText('GH₵25.00').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Create loan' })).toBeInTheDocument();
  }, 20_000);

  it('creates a loan from the preview step', async () => {
    const user = userEvent.setup({ delay: null });
    renderWizard();

    await screen.findByLabelText(/Borrower/);
    await user.selectOptions(screen.getByLabelText(/Borrower/), 'borrower-003');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.type(screen.getByLabelText(/Loan amount/), '300');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.selectOptions(screen.getByLabelText(/Payment day/), 'Monday');
    await user.type(screen.getByLabelText(/Cycle/), 'Cycle 2 — April 2026');
    await user.type(screen.getByLabelText(/Start date/), '2026-06-10');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(await screen.findByRole('button', { name: 'Create loan' }));

    await waitFor(
      () => {
      expect(mockCreateLoan).toHaveBeenCalledWith({
        borrowerId: 'borrower-003',
        amountPesewas: 30000,
        durationWeeks: 12,
        paymentDay: 'Monday',
        cycleBatch: 'Cycle 2 — April 2026',
        startDate: '2026-06-10',
      });
      expect(screen.getByText('Loan created')).toBeInTheDocument();
      },
      { timeout: 10_000 },
    );
  }, 20_000);
});
