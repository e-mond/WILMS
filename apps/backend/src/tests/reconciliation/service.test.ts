import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findSubmitted: vi.fn(),
  insertReconciliation: vi.fn(),
  appendHistory: vi.fn(),
  listPortfolioLoans: vi.fn(),
  listPayments: vi.fn(),
  runInTransaction: vi.fn(),
  runWithIdempotency: vi.fn(),
  appendAuditEntry: vi.fn(),
}));

vi.mock('../../db/client.js', () => ({
  isDatabaseEnabled: () => true,
  runInTransaction: mocks.runInTransaction,
}));

vi.mock('../../repositories/reconciliation.repository.js', () => ({
  findSubmittedReconciliationByCollectorAndDate: mocks.findSubmitted,
  insertReconciliation: mocks.insertReconciliation,
  findReconciliationById: vi.fn(),
  listReconciliations: vi.fn(),
}));

vi.mock('../../repositories/reconciliation-history.repository.js', () => ({
  appendReconciliationHistory: mocks.appendHistory,
}));

vi.mock('../../repositories/loan.repository.js', () => ({
  listPortfolioLoansForCollector: mocks.listPortfolioLoans,
}));

vi.mock('../../repositories/payment.repository.js', () => ({
  listConfirmedPaymentsForCollectorOnDate: mocks.listPayments,
}));

vi.mock('../../infrastructure/idempotency/run-with-idempotency.js', () => ({
  runWithIdempotency: mocks.runWithIdempotency,
}));

vi.mock('../../infrastructure/audit/audit-log.js', () => ({
  appendAuditEntry: mocks.appendAuditEntry,
}));

import { submitReconciliation } from '../../modules/reconciliation/service.js';

describe('reconciliation service', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.runWithIdempotency.mockImplementation(async ({ execute }) => execute());
    mocks.runInTransaction.mockImplementation(async (fn) => fn({}));
    mocks.findSubmitted.mockResolvedValue(undefined);
    mocks.listPortfolioLoans.mockResolvedValue([
      { paymentDay: 'Tuesday', weeklyPaymentPesewas: 10000 },
    ]);
    mocks.listPayments.mockResolvedValue([{ amountPesewas: 10000, status: 'CONFIRMED' }]);
    mocks.insertReconciliation.mockResolvedValue({
      id: 'rec-1',
      collectorUserId: 'collector-1',
      reconciliationDate: '2026-06-02',
      expectedDuePesewas: 10000,
      systemRecordedPesewas: 10000,
      physicalCashPesewas: 10000,
      primaryVariancePesewas: 0,
      varianceFlagged: false,
      submittedAt: new Date('2026-06-02T18:00:00.000Z'),
    });
  });

  it('submits reconciliation inside transaction and writes history + audit', async () => {
    const summary = await submitReconciliation({
      collectorId: 'collector-1',
      reconciliationDate: '2026-06-02',
      physicalCashPesewas: 10000,
      actorId: 'collector-1',
    });

    expect(summary.submitted).toBe(true);
    expect(mocks.insertReconciliation).toHaveBeenCalledOnce();
    expect(mocks.appendHistory).toHaveBeenCalledOnce();
    expect(mocks.appendAuditEntry).toHaveBeenCalledOnce();
  });

  it('blocks duplicate submission', async () => {
    mocks.findSubmitted.mockResolvedValue({
      id: 'existing',
      collectorUserId: 'collector-1',
      reconciliationDate: '2026-06-02',
      expectedDuePesewas: 10000,
      systemRecordedPesewas: 10000,
      physicalCashPesewas: 10000,
      primaryVariancePesewas: 0,
      varianceFlagged: false,
      submittedAt: new Date(),
    });

    await expect(
      submitReconciliation({
        collectorId: 'collector-1',
        reconciliationDate: '2026-06-02',
        physicalCashPesewas: 10000,
        actorId: 'collector-1',
      }),
    ).rejects.toThrow('VALIDATION:Reconciliation already submitted');
  });

  it('requires comment when variance is flagged', async () => {
    mocks.listPortfolioLoans.mockResolvedValue([
      { paymentDay: 'Tuesday', weeklyPaymentPesewas: 20000 },
    ]);

    await expect(
      submitReconciliation({
        collectorId: 'collector-1',
        reconciliationDate: '2026-06-02',
        physicalCashPesewas: 15000,
        actorId: 'collector-1',
      }),
    ).rejects.toThrow('comment of at least 10 characters');
  });
});
