import { beforeEach, describe, expect, it } from 'vitest';
import { TRANSACTION_TYPE } from '@/types/transaction';
import loanServiceMock, { resetMockLoans } from '@/services/mock/loanService.mock';
import { resetMockBorrowerRegistrations } from '@/services/mock/borrowerService.mock';
import { resetMockTransactions } from '@/services/mock/transactionService.mock';

describe('loanService.mock progress and payment log', () => {
  beforeEach(() => {
    resetMockBorrowerRegistrations();
    resetMockTransactions();
    resetMockLoans();
  });

  it('returns loan progress derived from repayment transactions', async () => {
    const progress = await loanServiceMock.getLoanProgress('loan-001');

    expect(progress).toMatchObject({
      loanId: 'loan-001',
      totalPaidPesewas: 15000,
      remainingBalancePesewas: 35000,
      percentRepaid: 30,
      weeksCompleted: 3,
    });
  });

  it('lists borrower loan history newest first', async () => {
    const loans = await loanServiceMock.listBorrowerLoans('borrower-001');

    expect(loans).toHaveLength(1);
    expect(loans[0]?.id).toBe('loan-001');
  });

  it('returns disbursement and repayment entries for the payment log', async () => {
    const log = await loanServiceMock.listLoanPaymentLog('loan-001');

    expect(log).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: TRANSACTION_TYPE.DISBURSEMENT,
          amountPesewas: 50000,
        }),
        expect.objectContaining({
          type: TRANSACTION_TYPE.REPAYMENT,
          amountPesewas: 5000,
        }),
      ]),
    );
  });
});
