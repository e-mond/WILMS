import type { loanPools, poolAllocations } from '../../db/schema/loan-pools.js';
import { formatPoolDisplayId } from '@wilms/shared-utils';

export interface LoanPoolSummaryDto {
  id: string;
  displayId: string;
  name: string;
  region: string;
  source: string;
  capitalPesewas: number;
  disbursedPesewas: number;
  collectedPesewas: number;
  outstandingPesewas: number;
  utilisationPercent: number;
  status: 'ACTIVE' | 'NEAR_FULL' | 'LAUNCHING';
  groupCount: number;
  cycleLabel: string;
  lastReplenishedAt: string;
  repaymentRatePercent: number;
}

export interface LoanPoolActivityDto {
  id: string;
  message: string;
  recordedAt: string;
}

export interface LoanPoolDetailDto extends LoanPoolSummaryDto {
  recentActivity: LoanPoolActivityDto[];
}

export interface LoanPoolAllocationSegmentDto {
  poolId: string;
  poolName: string;
  percent: number;
}

export interface LoanPoolListSummaryDto {
  totalPoolFundsPesewas: number;
  activePools: number;
  totalDisbursedPesewas: number;
  totalOutstandingPesewas: number;
}

export interface LoanPoolListResponseDto {
  generatedAt: string;
  summary: LoanPoolListSummaryDto;
  pools: LoanPoolSummaryDto[];
  allocation: LoanPoolAllocationSegmentDto[];
}

export function mapPoolRowToSummary(
  row: typeof loanPools.$inferSelect,
  sequence = 1,
): LoanPoolSummaryDto {
  return {
    id: row.id,
    displayId: formatPoolDisplayId({
      createdAt: row.createdAt?.toISOString(),
      sequence,
    }),
    name: row.name,
    region: row.region,
    source: row.source,
    capitalPesewas: row.capitalPesewas,
    disbursedPesewas: row.disbursedPesewas,
    collectedPesewas: row.collectedPesewas,
    outstandingPesewas: row.outstandingPesewas,
    utilisationPercent: row.utilisationPercent,
    status: row.status,
    groupCount: row.groupCount,
    cycleLabel: row.cycleLabel,
    lastReplenishedAt: row.lastReplenishedAt.toISOString().slice(0, 10),
    repaymentRatePercent: Number(row.repaymentRatePercent),
  };
}

export function mapAllocationToActivity(
  row: typeof poolAllocations.$inferSelect,
): LoanPoolActivityDto {
  return {
    id: row.id,
    message: row.description,
    recordedAt: row.recordedAt.toISOString(),
  };
}

export function buildListResponse(pools: LoanPoolSummaryDto[]): LoanPoolListResponseDto {
  const totalDisbursedPesewas = pools.reduce((total, pool) => total + pool.disbursedPesewas, 0);
  const totalOutstandingPesewas = pools.reduce((total, pool) => total + pool.outstandingPesewas, 0);
  const activePools = pools.filter((pool) => pool.status !== 'LAUNCHING').length;
  const allocationTotal = pools.reduce((total, pool) => total + pool.capitalPesewas, 0) || 1;

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalPoolFundsPesewas: pools.reduce((total, pool) => total + pool.capitalPesewas, 0),
      activePools,
      totalDisbursedPesewas,
      totalOutstandingPesewas,
    },
    pools,
    allocation: pools.map((pool) => ({
      poolId: pool.id,
      poolName: pool.name,
      percent: Math.round((pool.capitalPesewas / allocationTotal) * 100),
    })),
  };
}
