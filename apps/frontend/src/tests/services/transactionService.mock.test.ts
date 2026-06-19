import { beforeEach, describe, expect, it } from 'vitest';
import { API_ERROR_CODE } from '@/types/api';
import { TRANSACTION_TYPE } from '@/types/transaction';
import { resetMockBorrowerRegistrations } from '@/services/mock/borrowerService.mock';
import transactionServiceMock, { resetMockTransactions } from '@/services/mock/transactionService.mock';

describe('transactionService.mock', () => {
  beforeEach(() => {
    resetMockBorrowerRegistrations();
    resetMockTransactions();
  });

  it('lists approved borrowers without an admin fee', async () => {
    const borrowers = await transactionServiceMock.listBorrowersAwaitingAdminFee();

    expect(borrowers.map((borrower) => borrower.fullName)).toEqual(
      expect.arrayContaining(['Efua Boateng']),
    );
    expect(borrowers.some((borrower) => borrower.fullName === 'Ama Mensan')).toBe(false);
    expect(borrowers.some((borrower) => borrower.fullName === 'Ama Mensah')).toBe(false);
  });

  it('records an admin fee with collector id and ADMIN_FEE type', async () => {
    const transaction = await transactionServiceMock.recordAdminFee({
      borrowerId: 'borrower-002',
      collectorId: 'user-collector',
    });

    expect(transaction).toMatchObject({
      type: TRANSACTION_TYPE.ADMIN_FEE,
      borrowerId: 'borrower-002',
      amountPesewas: 5000,
      collectorId: 'user-collector',
    });

    const status = await transactionServiceMock.getAdminFeeStatus('borrower-002');

    expect(status.isPaid).toBe(true);
    expect(status.recordedByCollectorName).toBe('Field Collector');
  });

  it('blocks duplicate admin fee recording', async () => {
    await transactionServiceMock.recordAdminFee({
      borrowerId: 'borrower-002',
      collectorId: 'user-collector',
    });

    await expect(
      transactionServiceMock.recordAdminFee({
        borrowerId: 'borrower-002',
        collectorId: 'user-collector',
      }),
    ).rejects.toMatchObject({
      code: API_ERROR_CODE.DUPLICATE_TRANSACTION,
    });
  });

  it('rejects admin fee recording for non-approved borrowers', async () => {
    await expect(
      transactionServiceMock.recordAdminFee({
        borrowerId: 'borrower-pending-001',
        collectorId: 'user-collector',
      }),
    ).rejects.toMatchObject({
      code: API_ERROR_CODE.VALIDATION,
    });
  });
});
