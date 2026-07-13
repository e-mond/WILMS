import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  insertPool: vi.fn(),
  appendAllocation: vi.fn(),
  findPoolById: vi.fn(),
  listRecentAllocations: vi.fn(),
  appendAuditEntry: vi.fn(),
}));

vi.mock('../../db/client.js', () => ({
  isDatabaseEnabled: () => true,
}));

vi.mock('../../repositories/loan-pool.repository.js', () => ({
  insertPool: mocks.insertPool,
  appendAllocation: mocks.appendAllocation,
  findPoolById: mocks.findPoolById,
  listRecentAllocations: mocks.listRecentAllocations,
  refreshPoolAggregates: vi.fn().mockResolvedValue(undefined),
  listPools: vi.fn(),
}));

vi.mock('../../infrastructure/audit/audit-log.js', () => ({
  appendAuditEntry: mocks.appendAuditEntry,
}));

import { createLoanPool } from '../../modules/loan-pools/service.js';

describe('loan-pools service', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.insertPool.mockResolvedValue({
      id: 'pool-1',
      name: 'Greater Accra Pool',
      region: 'Greater Accra',
      source: 'Donor',
      capitalPesewas: 1_000_000,
      disbursedPesewas: 0,
      collectedPesewas: 0,
      outstandingPesewas: 0,
      utilisationPercent: 0,
      status: 'LAUNCHING',
      groupCount: 0,
      cycleLabel: 'Cycle 1',
      lastReplenishedAt: new Date('2026-06-01T00:00:00.000Z'),
      repaymentRatePercent: '0',
    });

    mocks.appendAllocation.mockResolvedValue('alloc-1');
    mocks.findPoolById.mockResolvedValue({
      id: 'pool-1',
      name: 'Greater Accra Pool',
      region: 'Greater Accra',
      source: 'Donor',
      capitalPesewas: 1_000_000,
      disbursedPesewas: 0,
      collectedPesewas: 0,
      outstandingPesewas: 0,
      utilisationPercent: 0,
      status: 'LAUNCHING',
      groupCount: 0,
      cycleLabel: 'Cycle 1',
      lastReplenishedAt: new Date('2026-06-01T00:00:00.000Z'),
      repaymentRatePercent: '0',
    });
    mocks.listRecentAllocations.mockResolvedValue([
      {
        id: 'alloc-1',
        poolId: 'pool-1',
        allocationType: 'REPLENISHMENT',
        amountPesewas: 1_000_000,
        description: 'Initial capital for Greater Accra Pool',
        recordedAt: new Date('2026-06-01T00:00:00.000Z'),
      },
    ]);
    mocks.appendAuditEntry.mockReturnValue({ id: 'audit-1' });
  });

  it('creates a pool with initial REPLENISHMENT allocation and audit', async () => {
    const result = await createLoanPool(
      {
        name: 'Greater Accra Pool',
        region: 'Greater Accra',
        source: 'Donor',
        capitalPesewas: 1_000_000,
        cycleLabel: 'Cycle 1',
      },
      'actor-1',
      'Super Admin',
    );

    expect(mocks.insertPool).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Greater Accra Pool',
        capitalPesewas: 1_000_000,
        status: 'LAUNCHING',
      }),
    );
    expect(mocks.appendAllocation).toHaveBeenCalledWith(
      expect.objectContaining({
        allocationType: 'REPLENISHMENT',
        amountPesewas: 1_000_000,
        actorUserId: 'actor-1',
      }),
    );
    expect(mocks.appendAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'loan-pool.created',
        targetEntityType: 'loan-pool',
      }),
    );
    expect(result.name).toBe('Greater Accra Pool');
    expect(result.recentActivity).toHaveLength(1);
  });
});
