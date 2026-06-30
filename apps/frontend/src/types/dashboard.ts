export type DashboardTrendDirection = 'up' | 'down' | 'neutral';

export type DashboardValueTone = 'gold' | 'success' | 'danger' | 'default';

export type DashboardBorrowerTone =
  | 'active'
  | 'atRisk'
  | 'defaulted'
  | 'blacklisted'
  | 'pending';

export type DashboardGroupRiskTone = 'low' | 'atRisk' | 'flagged' | 'suspended';

export type DashboardGroupRiskLevel = 'LOW_RISK' | 'AT_RISK' | 'FLAGGED' | 'SUSPENDED';

export interface DashboardGroupRiskInput {
  groupName: string;
  riskLevel: DashboardGroupRiskLevel;
}

export type DashboardAlertSeverity = 'danger' | 'warning' | 'info';

export type DashboardAlertCategory =
  | 'MISSED_PAYMENT'
  | 'RECONCILIATION_VARIANCE'
  | 'LOAN_APPROVED'
  | 'LOAN_REJECTED'
  | 'DUPLICATE_REGISTRATION_BLOCKED'
  | 'POOL_REPLENISHED'
  | 'BORROWER_BLACKLISTED'
  | 'COLLECTOR_BELOW_THRESHOLD'
  | 'GROUP_ESCALATED'
  | 'RISK_FLAG_TRIGGERED'
  | 'AUDIT_WARNING'
  | 'SAME_DAY_EDIT_WARNING';

export type DashboardAlertIcon = 'danger' | 'warning' | 'info' | 'edit';

export interface DashboardKpi {
  id: string;
  label: string;
  amountPesewas: number;
  valueKind?: 'currency' | 'count';
  trendLabel?: string;
  trendDirection?: DashboardTrendDirection;
  trendTone?: DashboardValueTone;
  valueTone?: DashboardValueTone;
}

export interface DashboardBorrowerSegment {
  id: string;
  label: string;
  count: number;
  tone: DashboardBorrowerTone;
}

export interface DashboardCollectorPerformanceRow {
  collectorId: string;
  name: string;
  expectedPesewas: number;
  actualPesewas: number;
  collectionRatePercent: number;
  variancePesewas: number;
}

export interface DashboardGroupRiskSegment {
  label: string;
  count: number;
  percent: number;
  tone: DashboardGroupRiskTone;
}

export interface DashboardCycleMetric {
  label: string;
  value: string;
}

export interface DashboardAlert {
  id: string;
  severity: DashboardAlertSeverity;
  category: DashboardAlertCategory;
  message: string;
  createdAt: string;
  icon: DashboardAlertIcon;
  entityRef?: string;
  href?: string;
}

export interface DashboardSummary {
  generatedAt: string;
  kpis: DashboardKpi[];
  borrowerSegments: DashboardBorrowerSegment[];
  collectorPerformance: DashboardCollectorPerformanceRow[];
  groupRisk: DashboardGroupRiskSegment[];
  totalGroups: number;
  cycleMetrics: DashboardCycleMetric[];
  recentAlerts: DashboardAlert[];
}
