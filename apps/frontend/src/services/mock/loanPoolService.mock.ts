import { MOCK_LOAN_POOLS } from '@/mocks/loan-pools';
import { LOAN_POOL_STATUS, type LoanPoolDetail, type CreateLoanPoolInput } from '@/types/loan-pool';
import type { ILoanPoolService } from '@/types/services';
import { simulateDelay } from '@/services/mock/delay';
import { buildLoanPoolListResponse } from '@/utils/loan-pool-list';

const loanPoolServiceMock: ILoanPoolService = {
  async listLoanPools() {
    await simulateDelay();
    return buildLoanPoolListResponse(MOCK_LOAN_POOLS);
  },

  async getLoanPool(id: string) {
    await simulateDelay();

    const pool = MOCK_LOAN_POOLS.find((entry) => entry.id === id);

    if (!pool) {
      throw new Error('Loan pool not found');
    }

    const detail: LoanPoolDetail = {
      ...pool,
      recentActivity: [
        {
          id: 'pool-act-1',
          message: `${pool.id} utilisation at ${pool.utilisationPercent}%`,
          recordedAt: new Date().toISOString(),
        },
        {
          id: 'pool-act-2',
          message: `${pool.name} last replenished`,
          recordedAt: `${pool.lastReplenishedAt}T09:00:00.000Z`,
        },
      ],
    };

    return detail;
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
      groupCount: 0,
      cycleLabel: input.cycleLabel,
      lastReplenishedAt: new Date().toISOString().slice(0, 10),
      repaymentRatePercent: 0,
      recentActivity: [],
    };
    return detail;
  },
};

export default loanPoolServiceMock;
