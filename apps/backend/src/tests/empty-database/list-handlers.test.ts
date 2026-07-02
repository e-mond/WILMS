import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMocks = vi.hoisted(() => ({
  select: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  groupBy: vi.fn(),
}));

vi.mock('../../db/persistence.js', () => ({
  listBorrowers: vi.fn(async () => []),
  listPayments: vi.fn(async () => []),
  listGroups: vi.fn(async () => []),
}));

vi.mock('../../db/client.js', () => ({
  isDatabaseEnabled: () => true,
  getDb: () => ({
    select: dbMocks.select,
  }),
}));

vi.mock('../../repositories/loan.repository.js', () => ({
  listLoans: vi.fn(async () => []),
}));

vi.mock('../../repositories/loan-pool.repository.js', () => ({
  listPools: vi.fn(async () => []),
}));

vi.mock('../../repositories/user.repository.js', () => ({
  listCollectors: vi.fn(async () => []),
}));

function mockEmptySelectChain() {
  dbMocks.groupBy.mockResolvedValue([]);
  const whereResult = {
    groupBy: dbMocks.groupBy,
    then(onFulfilled: (value: unknown[]) => unknown, onRejected?: (reason: unknown) => unknown) {
      return Promise.resolve([]).then(onFulfilled, onRejected);
    },
  };
  dbMocks.where.mockReturnValue(whereResult);
  dbMocks.from.mockReturnValue({
    where: dbMocks.where,
    groupBy: dbMocks.groupBy,
  });
  dbMocks.select.mockReturnValue({ from: dbMocks.from });
}

import { getDashboardSummary } from '../../modules/dashboard/service.js';
import { listBorrowerSummaries } from '../../modules/borrowers/service.js';
import { listLoans, listPortfolioEntries } from '../../modules/loans/service.js';
import { listLoanPools } from '../../modules/loan-pools/service.js';
import { listGroupsResponse } from '../../modules/groups/service.js';
import { listCollectors } from '../../modules/collectors/service.js';
import { listRiskFlags } from '../../modules/risk-flags/service.js';

describe('empty database list handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEmptySelectChain();
  });

  it('returns dashboard summary with zero KPIs', async () => {
    const summary = await getDashboardSummary();
    expect(summary.borrowerSegments.every((segment) => segment.count === 0)).toBe(true);
    expect(summary.totalGroups).toBe(0);
  });

  it('returns empty borrower list', async () => {
    await expect(listBorrowerSummaries()).resolves.toEqual([]);
  });

  it('returns empty loan lists', async () => {
    await expect(listLoans('ACTIVE')).resolves.toEqual([]);
    await expect(listPortfolioEntries()).resolves.toEqual([]);
  });

  it('returns empty loan pool list response', async () => {
    const response = await listLoanPools();
    expect(response.pools).toEqual([]);
  });

  it('returns empty groups response', async () => {
    const response = await listGroupsResponse();
    expect(response.groups).toEqual([]);
    expect(response.summary.activeGroups).toBe(0);
  });

  it('returns empty collectors response', async () => {
    const response = await listCollectors();
    expect(response.collectors).toEqual([]);
    expect(response.summary.totalCollectors).toBe(0);
  });

  it('returns empty risk flags response', async () => {
    const response = await listRiskFlags();
    expect(response.flags).toEqual([]);
    expect(response.summary.openFlags).toBe(0);
  });
});
