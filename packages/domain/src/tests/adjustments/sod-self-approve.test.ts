import { describe, expect, it, vi } from 'vitest';

vi.mock('../../db/client.js', () => ({
  isDatabaseEnabled: () => true,
  getDb: () => ({}),
  runInTransaction: async (fn: (tx: unknown) => Promise<unknown>) => fn({}),
}));

vi.mock('../../repositories/adjustment.repository.js', () => ({
  findAdjustmentById: vi.fn(async () => ({
    id: 'adj-1',
    status: 'PENDING',
    requestedByUserId: 'user-requester',
    version: 1,
    borrowerId: 'borrower-1',
    loanId: 'loan-1',
    type: 'BALANCE_ADJUSTMENT',
    amountPesewas: 1000,
    reason: 'test',
  })),
  approveAdjustmentRow: vi.fn(),
}));

vi.mock('../../infrastructure/idempotency/run-with-idempotency.js', () => ({
  runWithIdempotency: async (input: { execute: () => Promise<unknown> }) => input.execute(),
}));

describe('adjustment SoD', () => {
  it('blocks the requester from approving their own adjustment', async () => {
    const { approveAdjustment } = await import('../../modules/adjustments/service.js');
    await expect(
      approveAdjustment('adj-1', 'user-requester', 'Requester'),
    ).rejects.toThrow(/cannot approve an adjustment you requested/i);
  });
});
