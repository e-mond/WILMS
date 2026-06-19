import { beforeEach, describe, expect, it } from 'vitest';
import { API_ERROR_CODE } from '@/types/api';
import { LOAN_STATUS } from '@/types/loan';
import loanServiceMock, { resetMockLoans } from '@/services/mock/loanService.mock';
import transactionServiceMock, { resetMockTransactions } from '@/services/mock/transactionService.mock';
import { resetMockBorrowerRegistrations } from '@/services/mock/borrowerService.mock';

describe('loanService.mock disbursement gate', () => {
  beforeEach(() => {
    resetMockBorrowerRegistrations();
    resetMockTransactions();
    resetMockLoans();
  });

  it('blocks disbursement until admin fee is recorded', async () => {
    const eligibility = await loanServiceMock.getDisbursementEligibility('borrower-002');

    expect(eligibility.canDisburse).toBe(false);
    expect(eligibility.reason).toContain('Admin fee');

    await expect(loanServiceMock.disburseLoan('loan-pending-001')).rejects.toMatchObject({
      code: API_ERROR_CODE.VALIDATION,
    });
  });

  it('allows disbursement after admin fee is recorded', async () => {
    await transactionServiceMock.recordAdminFee({
      borrowerId: 'borrower-002',
      collectorId: 'user-collector',
    });

    const eligibility = await loanServiceMock.getDisbursementEligibility('borrower-002');
    expect(eligibility.canDisburse).toBe(true);

    const loan = await loanServiceMock.disburseLoan('loan-pending-001');
    expect(loan.status).toBe(LOAN_STATUS.ACTIVE);
  });
});
