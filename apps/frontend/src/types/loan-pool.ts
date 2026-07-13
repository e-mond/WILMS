export const LOAN_POOL_STATUS = {
  ACTIVE: 'ACTIVE',
  NEAR_FULL: 'NEAR_FULL',
  LAUNCHING: 'LAUNCHING',
} as const;

export type LoanPoolStatus = (typeof LOAN_POOL_STATUS)[keyof typeof LOAN_POOL_STATUS];

export interface LoanPoolSummary {
  id: string;
  displayId?: string;
  name: string;
  region: string;
  source: string;
  capitalPesewas: number;
  disbursedPesewas: number;
  collectedPesewas: number;
  outstandingPesewas: number;
  utilisationPercent: number;
  status: LoanPoolStatus;
  groupCount: number;
  cycleLabel: string;
  lastReplenishedAt: string;
  repaymentRatePercent: number;
}

export interface LoanPoolDetail extends LoanPoolSummary {
  recentActivity: LoanPoolActivity[];
}

export interface LoanPoolActivity {
  id: string;
  message: string;
  recordedAt: string;
}

export interface LoanPoolListSummary {
  totalPoolFundsPesewas: number;
  activePools: number;
  totalDisbursedPesewas: number;
  totalCollectedPesewas: number;
  totalOutstandingPesewas: number;
}

export interface LoanPoolListResponse {
  generatedAt: string;
  summary: LoanPoolListSummary;
  pools: LoanPoolSummary[];
  allocation: LoanPoolAllocationSegment[];
}

export interface LoanPoolAllocationSegment {
  poolId: string;
  poolName: string;
  percent: number;
}

export interface CreateLoanPoolInput {
  name: string;
  region: string;
  source: string;
  capitalPesewas: number;
  cycleLabel: string;
}
