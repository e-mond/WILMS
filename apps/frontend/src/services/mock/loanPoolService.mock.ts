import { MOCK_LOAN_POOLS } from '@/mocks/loan-pools';
import {
  LOAN_POOL_STATUS,
  type AssignLoanPoolMembershipInput,
  type CreateLoanPoolInput,
  type LoanPoolDetail,
  type LoanPoolGroupOption,
  type LoanPoolSummary,
} from '@/types/loan-pool';
import type { ILoanPoolService } from '@/types/services';
import { simulateDelay } from '@/services/mock/delay';
import { buildLoanPoolListResponse } from '@/utils/loan-pool-list';
import { derivePoolAggregates } from '@/utils/loan-pool-aggregates';

let mockPools: LoanPoolSummary[] = [...MOCK_LOAN_POOLS];
const mockMemberships = new Map<string, string>(); // groupId -> poolId
let unassignedGroups: LoanPoolGroupOption[] = [
  { id: 'group-unassigned-1', name: 'Tema Market Circle', community: 'Tema' },
  { id: 'group-unassigned-2', name: 'Kaneshie Traders', community: 'Accra' },
];

function toDetail(pool: LoanPoolSummary): LoanPoolDetail {
  return {
    ...pool,
    recentActivity: [
      {
        id: `${pool.id}-util`,
        message: `${pool.name} utilisation at ${pool.utilisationPercent}%`,
        recordedAt: new Date().toISOString(),
      },
    ],
  };
}

const loanPoolServiceMock: ILoanPoolService = {
  async listLoanPools() {
    await simulateDelay();
    return buildLoanPoolListResponse(mockPools);
  },

  async getLoanPool(id: string) {
    await simulateDelay();
    const pool = mockPools.find((entry) => entry.id === id);
    if (!pool) {
      throw new Error('Loan pool not found');
    }
    return toDetail(pool);
  },

  async createLoanPool(input: CreateLoanPoolInput) {
    await simulateDelay();
    const detail: LoanPoolDetail = {
      id: `pool-${Date.now()}`,
      name: input.name,
      region: input.region,
      source: input.source,
      capitalPesewas: input.capitalPesewas,
      disbursedPesewas: 0,
      collectedPesewas: 0,
      outstandingPesewas: 0,
      utilisationPercent: 0,
      status: LOAN_POOL_STATUS.LAUNCHING,
      groupCount: input.groupIds?.length ?? 0,
      cycleLabel: input.cycleLabel,
      lastReplenishedAt: new Date().toISOString().slice(0, 10),
      repaymentRatePercent: 0,
      recentActivity: [],
    };

    for (const groupId of input.groupIds ?? []) {
      mockMemberships.set(groupId, detail.id);
      unassignedGroups = unassignedGroups.filter((group) => group.id !== groupId);
    }

    mockPools = [detail, ...mockPools];
    return detail;
  },

  async listUnassignedGroups() {
    await simulateDelay();
    return unassignedGroups;
  },

  async assignGroupMembership(poolId: string, input: AssignLoanPoolMembershipInput) {
    await simulateDelay();
    const poolIndex = mockPools.findIndex((entry) => entry.id === poolId);
    if (poolIndex === -1) {
      throw new Error('Loan pool not found');
    }

    mockMemberships.set(input.groupId, poolId);
    unassignedGroups = unassignedGroups.filter((group) => group.id !== input.groupId);
    const updated: LoanPoolSummary = {
      ...mockPools[poolIndex],
      groupCount: mockPools[poolIndex].groupCount + 1,
    };
    mockPools = [
      ...mockPools.slice(0, poolIndex),
      updated,
      ...mockPools.slice(poolIndex + 1),
    ];
    return toDetail(updated);
  },
};

export function applyMockPoolDisbursement(poolId: string, amountPesewas: number): void {
  mockPools = mockPools.map((pool) => {
    if (pool.id !== poolId) {
      return pool;
    }

    const aggregates = derivePoolAggregates({
      capitalPesewas: pool.capitalPesewas,
      totals: {
        disbursedPesewas: pool.disbursedPesewas + amountPesewas,
        collectedPesewas: pool.collectedPesewas,
        replenishmentPesewas: pool.capitalPesewas,
        adjustmentPesewas: 0,
      },
    });

    return {
      ...pool,
      disbursedPesewas: aggregates.disbursedPesewas,
      collectedPesewas: aggregates.collectedPesewas,
      outstandingPesewas: aggregates.outstandingPesewas,
      utilisationPercent: aggregates.utilisationPercent,
      status: aggregates.status,
    };
  });
}

export function resetMockLoanPools(): void {
  mockPools = [...MOCK_LOAN_POOLS];
  mockMemberships.clear();
  unassignedGroups = [
    { id: 'group-unassigned-1', name: 'Tema Market Circle', community: 'Tema' },
    { id: 'group-unassigned-2', name: 'Kaneshie Traders', community: 'Accra' },
  ];
}

export default loanPoolServiceMock;
