import { DEMO_OPERATING_POOL_PESEWAS } from '@/constants/dashboard';
import type {
  LoanPoolAllocationSegment,
  LoanPoolListResponse,
  LoanPoolSummary,
} from '@/types/loan-pool';

export function buildLoanPoolListResponse(pools: LoanPoolSummary[]): LoanPoolListResponse {
  const totalDisbursedPesewas = pools.reduce((total, pool) => total + pool.disbursedPesewas, 0);
  const totalCollectedPesewas = pools.reduce((total, pool) => total + pool.collectedPesewas, 0);
  const totalOutstandingPesewas = pools.reduce((total, pool) => total + pool.outstandingPesewas, 0);
  const activePools = pools.filter((pool) => pool.capitalPesewas > 0).length;
  const allocationTotal = pools.reduce((total, pool) => total + pool.capitalPesewas, 0) || 1;

  const allocation: LoanPoolAllocationSegment[] = pools.map((pool) => ({
    poolId: pool.id,
    poolName: pool.name,
    percent: Math.round((pool.capitalPesewas / allocationTotal) * 100),
  }));

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalPoolFundsPesewas: DEMO_OPERATING_POOL_PESEWAS,
      activePools,
      totalDisbursedPesewas,
      totalCollectedPesewas,
      totalOutstandingPesewas,
    },
    pools,
    allocation,
  };
}
