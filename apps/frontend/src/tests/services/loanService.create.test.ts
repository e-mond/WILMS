import { beforeEach, describe, expect, it } from 'vitest';
import { API_ERROR_CODE } from '@/types/api';
import { LOAN_STATUS } from '@/types/loan';
import { resetMockBorrowerRegistrations } from '@/services/mock/borrowerService.mock';
import loanServiceMock, { resetMockLoans } from '@/services/mock/loanService.mock';
import { resetMockTransactions } from '@/services/mock/transactionService.mock';

describe('loanService.mock create loan', () => {
  beforeEach(() => {
    resetMockBorrowerRegistrations();
    resetMockTransactions();
    resetMockLoans();
  });

  it('lists only borrowers with admin fee and no open loan', async () => {
    const eligible = await loanServiceMock.listEligibleBorrowers();

    expect(eligible.map((borrower) => borrower.fullName)).toEqual(['Ama Mensan']);
  });

  it('creates a pending disbursement loan for an eligible borrower', async () => {
    const loan = await loanServiceMock.createLoan({
      borrowerId: 'borrower-003',
      amountPesewas: 30000,
      durationWeeks: 12,
      paymentDay: 'Monday',
      cycleBatch: 'Cycle 2 — April 2026',
      startDate: '2026-06-10',
    });

    expect(loan).toMatchObject({
      borrowerId: 'borrower-003',
      amountPesewas: 30000,
      weeklyPaymentPesewas: 2500,
      status: LOAN_STATUS.PENDING_DISBURSEMENT,
    });

    const schedule = await loanServiceMock.getLoanSchedule(loan.id);

    expect(schedule.weeks).toHaveLength(12);
    expect(schedule.weeks[0]).toMatchObject({
      weekNumber: 1,
      dueDate: '2026-06-15',
      amountPesewas: 2500,
    });
    expect(schedule.weeks[11]?.weekNumber).toBe(12);
  });

  it('blocks loan creation without admin fee', async () => {
    await expect(
      loanServiceMock.createLoan({
        borrowerId: 'borrower-002',
        amountPesewas: 30000,
        durationWeeks: 12,
        paymentDay: 'Monday',
        cycleBatch: 'Cycle 2 — April 2026',
        startDate: '2026-06-10',
      }),
    ).rejects.toMatchObject({
      code: API_ERROR_CODE.VALIDATION,
    });
  });
});
