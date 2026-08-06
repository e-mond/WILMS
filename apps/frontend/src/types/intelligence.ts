/** Response shapes for /intelligence, /exports, and related ops surfaces (partial/loose). */

export interface ExecutiveDashboardFilters {
  district?: string | null;
  community?: string | null;
}

export interface ExecutiveFinancialKpis {
  totalPortfolioPesewas?: number;
  activePortfolioPesewas?: number;
  disbursedPesewas?: number;
  collectedPesewas?: number;
  outstandingPesewas?: number;
  writeOffsPesewas?: number;
  recoveryRatePercent?: number;
  operatingCashPesewas?: number;
  expenseRatioPercent?: number;
  poolUtilizationPercent?: number;
  liquidityPesewas?: number;
  totalExpensesPesewas?: number;
  collectionRatePercent?: number;
}

export interface ExecutiveOperationalKpis {
  activeGroups?: number;
  activeBorrowers?: number;
  activeLoans?: number;
  closedLoans?: number;
  reconciliationAlerts?: number;
  notificationSent?: number;
  notificationFailed?: number;
  approvalQueueHint?: number;
}

export interface ExecutiveRiskKpis {
  par30Count?: number;
  par60Count?: number;
  par90Count?: number;
  par30RatePercent?: number;
  par60RatePercent?: number;
  par90RatePercent?: number;
  writeOffTrend?: {
    approved?: number;
    pending?: number;
    totalPesewas?: number;
  };
  recentAlerts?: Array<{ id?: string; message?: string; category?: string }>;
}

export interface ExecutiveDashboard {
  generatedAt: string;
  asOfDate: string;
  filters: ExecutiveDashboardFilters;
  financial: ExecutiveFinancialKpis;
  operational: ExecutiveOperationalKpis;
  risk: ExecutiveRiskKpis;
  opsHealth?: {
    databaseEnabled?: boolean;
    healthStatus?: string;
    backupStatus?: string;
    surfacesDegraded?: number;
  };
  expensePeriods?: {
    todayPesewas?: number;
    weekPesewas?: number;
    monthPesewas?: number;
    yearPesewas?: number;
  };
}

export interface ForecastSeriesPoint {
  weekStarting: string;
  expectedPesewas: number;
  projectedPesewas: number;
  expensePesewas: number;
}

export interface ForecastSnapshot {
  generatedAt: string;
  horizonDays: number;
  assumptions?: {
    method?: string;
    collectionRatePercent?: number;
    weeklyDuePesewas?: number;
  };
  summary: {
    expectedCollectionsPesewas?: number;
    projectedCollectionsPesewas?: number;
    projectedCashFlowPesewas?: number;
    liquidityForecastPesewas?: number;
    poolUtilizationForecastPercent?: number;
    delinquencyPressureIndex?: number;
    projectedExpensesPesewas?: number;
  };
  series: ForecastSeriesPoint[];
}

export interface PortfolioBreakdown {
  generatedAt: string;
  summary?: {
    disbursedPesewas?: number;
    outstandingPesewas?: number;
    collectedPesewas?: number;
    activeLoans?: number;
  };
  byCommunity?: Array<{
    community: string;
    groups: number;
    members: number;
    avgCollectionRatePercent?: number;
  }>;
}

export interface CompliancePack {
  generatedAt: string;
  userAccess?: {
    totalUsers?: number;
    activeUsers?: number;
    invitedUsers?: number;
    inactiveUsers?: number;
  };
  permissionOverrides?: { totalOverrides?: number };
  makerChecker?: { note?: string };
  financialIntegrity?: { note?: string };
}

export interface AlertThreshold {
  id: string;
  key: string;
  label: string;
  metric: string;
  operator?: string;
  thresholdValue: number;
  severity?: string;
  enabled?: boolean;
}

export interface EarlyWarningEvent {
  id: string;
  thresholdKey?: string;
  severity: string;
  title: string;
  message: string;
  metricValue?: number;
  createdAt?: string;
}

export interface EarlyWarningEvaluation {
  generatedAt: string;
  metrics?: Record<string, number>;
  triggered: EarlyWarningEvent[];
}

export type ExportJobFormat = 'CSV' | 'EXCEL' | 'PDF';

export interface ExportJob {
  id: string;
  entityType: string;
  format: ExportJobFormat | string;
  status: string;
  requestedByUserId?: string;
  filters?: Record<string, unknown> | null;
  rowCount?: number | null;
  fileName?: string | null;
  errorMessage?: string | null;
  expiresAt?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  previewRows?: Array<Record<string, unknown>>;
}

export interface CreateExportJobInput {
  entityType: string;
  format: ExportJobFormat;
  filters?: Record<string, unknown>;
}

export interface OperationalIncident {
  id: string;
  title: string;
  severity: string;
  status: string;
  ownerUserId?: string | null;
  summary?: string | null;
  resolution?: string | null;
  openedAt?: string;
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
  createdByUserId?: string;
  updatedAt?: string;
}

export interface CreateIncidentInput {
  title: string;
  severity?: string;
  summary?: string;
  ownerUserId?: string;
}

export interface MaintenanceWindow {
  id: string;
  title: string;
  message: string;
  startsAt: string;
  endsAt: string;
  active?: boolean;
  createdByUserId?: string;
  createdAt?: string;
}

export interface CreateMaintenanceWindowInput {
  title: string;
  message: string;
  startsAt: string;
  endsAt: string;
}

export interface ExecutiveDashboardParams {
  district?: string;
  community?: string;
  asOf?: string;
}
