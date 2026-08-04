import { describe, expect, it, vi } from 'vitest';

vi.mock('../../db/client.js', () => ({
  isDatabaseEnabled: () => true,
  getDb: () => ({}),
  requireDatabase: vi.fn(),
  runInTransaction: async (fn: (tx: unknown) => Promise<unknown>) => {
    let selectCall = 0;
    const tx = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(async () => {
              selectCall += 1;
              if (selectCall === 1) {
                return [
                  {
                    id: 'conflict-1',
                    status: 'PENDING_REVIEW',
                    operationId: 'op-1',
                  },
                ];
              }
              return [
                {
                  id: 'op-1',
                  operationType: 'RECORD_PAYMENT',
                  actorUserId: 'collector-1',
                  payload: {},
                  idempotencyKey: 'key-1',
                },
              ];
            }),
          })),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({ where: vi.fn(async () => []) })),
      })),
    };
    return fn(tx);
  },
}));

vi.mock('../../modules/payments/service.js', () => ({
  recordPayment: vi.fn(),
}));

describe('sync conflict approval SoD', () => {
  it('blocks resolving your own offline operation conflict', async () => {
    const { approveConflict } = await import('../../modules/sync/service.js');
    await expect(approveConflict('conflict-1', 'collector-1')).rejects.toThrow(/FORBIDDEN:/);
  });
});
