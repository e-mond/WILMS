import { beforeEach, describe, expect, it } from 'vitest';
import { LOAN_STATUS } from '@/types/loan';
import loanServiceMock, { resetMockLoans } from '@/services/mock/loanService.mock';
import { resetMockBorrowerRegistrations } from '@/services/mock/borrowerService.mock';
import { resetMockTransactions } from '@/services/mock/transactionService.mock';

describe('loanService.mock portfolio', () => {
  beforeEach(() => {
    resetMockBorrowerRegistrations();
    resetMockTransactions();
    resetMockLoans();
  });

  it('returns portfolio entries with borrower details and balances', async () => {
    const entries = await loanServiceMock.listPortfolioEntries();

    expect(entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'loan-001',
          borrowerName: 'Ama Mensah',
          outstandingPesewas: 35000,
          status: LOAN_STATUS.ACTIVE,
        }),
        expect.objectContaining({
          id: 'loan-completed-001',
          borrowerName: 'Ama Mensan',
          outstandingPesewas: 0,
          status: LOAN_STATUS.COMPLETED,
        }),
      ]),
    );
  });
});
