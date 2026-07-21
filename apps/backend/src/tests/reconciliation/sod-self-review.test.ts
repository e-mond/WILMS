import { describe, expect, it, vi } from 'vitest';

vi.mock('../../db/client.js', () => ({
  isDatabaseEnabled: () => true,
  getDb: () => ({
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(async () => []) })) })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => [
            {
              id: 'rec-1',
              collectorUserId: 'collector-1',
              status: 'PENDING_REVIEW',
              reviewedByUserId: null,
              resolutionNotes: null,
            },
          ]),
        })),
      })),
    })),
  }),
  requireDatabase: vi.fn(),
  runInTransaction: async (fn: (tx: unknown) => Promise<unknown>) => fn({}),
}));

vi.mock('../../repositories/reconciliation.repository.js', () => ({
  findReconciliationById: vi.fn(async () => ({
    id: 'rec-1',
    collectorUserId: 'collector-1',
    status: 'PENDING_REVIEW',
    reviewedByUserId: null,
    resolutionNotes: null,
  })),
}));

vi.mock('../../repositories/reconciliation-history.repository.js', () => ({
  appendReconciliationHistory: vi.fn(async () => undefined),
}));

describe('reconciliation review SoD', () => {
  it('blocks the submitting collector from reviewing their own reconciliation', async () => {
    const { reviewReconciliation } = await import('../../modules/reconciliation/service.js');
    await expect(
      reviewReconciliation('rec-1', {
        status: 'APPROVED',
        reviewerUserId: 'collector-1',
      }),
    ).rejects.toThrow(/FORBIDDEN:/);
  });
});
