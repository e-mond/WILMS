import { beforeEach, describe, expect, it } from 'vitest';
import { AUDIT_ACTION } from '@/constants/audit';
import adjustmentServiceMock, { resetMockAdjustments } from '@/services/mock/adjustmentService.mock';
import { getAuditEntries, resetAuditLog } from '@/services/mock/audit-log.store';
import { getBorrowerRegistryEntry, resetBorrowerRegistry } from '@/services/mock/borrower-registry.store';
import { getFinancialTransactions, resetFinancialTransactions } from '@/services/mock/transaction-log.store';
import { resetMockLoans } from '@/services/mock/loanService.mock';
import { ADJUSTMENT_STATUS, ADJUSTMENT_TYPE } from '@/types/adjustment';
import { BORROWER_STATUS } from '@/types/borrower';
import { TRANSACTION_TYPE } from '@/types/transaction';

describe('adjustmentService.mock', () => {
  beforeEach(() => {
    resetMockAdjustments();
    resetAuditLog();
    resetBorrowerRegistry();
    resetFinancialTransactions();
    resetMockLoans();
  });

  it('creates a pending adjustment request and writes an audit entry', async () => {
    const created = await adjustmentServiceMock.createAdjustment(
      {
        type: ADJUSTMENT_TYPE.PAYMENT_CORRECTION,
        borrowerId: 'borrower-001',
        borrowerName: 'Ama Mensah',
        loanId: 'loan-001',
        amountPesewas: 5000,
        reason: 'Collector recorded the wrong weekly amount after the payment day ended.',
      },
      'user-collector',
      'Field Collector',
    );

    expect(created.status).toBe(ADJUSTMENT_STATUS.PENDING);
    expect(created.requestedBy).toBe('Field Collector');
    expect(
      (await adjustmentServiceMock.listPendingAdjustments()).requests.some(
        (request) => request.id === created.id,
      ),
    ).toBe(true);
    expect(
      getAuditEntries().some((entry) => entry.action === AUDIT_ACTION.ADJUSTMENT_REQUESTED),
    ).toBe(true);
  });

  it('approves a pending adjustment and posts a ledger entry', async () => {
    const pending = (await adjustmentServiceMock.listPendingAdjustments()).requests[0];

    const approved = await adjustmentServiceMock.approveAdjustment(
      pending.id,
      'user-super-admin',
      'Super Admin',
    );

    expect(approved.status).toBe(ADJUSTMENT_STATUS.APPROVED);
    expect(
      getFinancialTransactions().some(
        (transaction) =>
          transaction.type === TRANSACTION_TYPE.ADJUSTMENT &&
          transaction.borrowerId === pending.borrowerId,
      ),
    ).toBe(true);
    expect(
      getAuditEntries().some((entry) => entry.action === AUDIT_ACTION.ADJUSTMENT_APPROVED),
    ).toBe(true);
  });

  it('rejects a pending adjustment with a required reason', async () => {
    const pending = (await adjustmentServiceMock.listPendingAdjustments()).requests[0];

    const rejected = await adjustmentServiceMock.rejectAdjustment(
      pending.id,
      { reason: 'Insufficient supporting documentation provided.' },
      'user-super-admin',
      'Super Admin',
    );

    expect(rejected.status).toBe(ADJUSTMENT_STATUS.REJECTED);
    expect(
      getAuditEntries().some((entry) => entry.action === AUDIT_ACTION.ADJUSTMENT_REJECTED),
    ).toBe(true);
  });

  it('blacklists borrower on approved write-off', async () => {
    const writeOff = (await adjustmentServiceMock.listPendingAdjustments()).requests.find(
      (request) => request.type === ADJUSTMENT_TYPE.WRITE_OFF,
    );

    expect(writeOff).toBeDefined();

    await adjustmentServiceMock.approveAdjustment(
      writeOff!.id,
      'user-super-admin',
      'Super Admin',
    );

    expect(getBorrowerRegistryEntry(writeOff!.borrowerId)?.status).toBe(
      BORROWER_STATUS.BLACKLISTED,
    );
  });
});
