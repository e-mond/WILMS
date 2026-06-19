import { MOCK_LOAN_POOLS } from '@/mocks/loan-pools';
import type { LoanPoolDetail } from '@/types/loan-pool';
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
};

export default loanPoolServiceMock;
