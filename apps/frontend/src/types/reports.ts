import type { LoanPortfolioEntry, LoanPortfolioSummary } from '@/types/loan';

export interface LoanPortfolioReportParams {
  search?: string;
  status?: string;
  cycleBatch?: string;
}

export interface LoanPortfolioReport {
  generatedAt: string;
  summary: LoanPortfolioSummary;
  entries: LoanPortfolioEntry[];
}

export interface DailyCollectionReportParams {
  date: string;
  collectorId?: string;
}

export interface DailyCollectionReportSummary {
  date: string;
  paymentDayLabel: string;
  borrowersDueCount: number;
  borrowersPaidCount: number;
  expectedPesewas: number;
  collectedPesewas: number;
  variancePesewas: number;
  collectorsActiveCount: number;
}

export interface DailyCollectionReportRow {
  id: string;
  borrowerId: string;
  borrowerName: string;
  community: string;
  loanId?: string;
  collectorId: string;
  collectorName: string;
  expectedPesewas: number;
  collectedPesewas: number;
  variancePesewas: number;
  recordedAt?: string;
}

export interface DailyCollectionReport {
  generatedAt: string;
  summary: DailyCollectionReportSummary;
  rows: DailyCollectionReportRow[];
}

export interface DefaulterReportRow {
  id: string;
  borrowerId: string;
  borrowerName: string;
  community: string;
  groupName: string;
  missedWeeks: number;
  outstandingPesewas: number;
  lastPaymentDate?: string;
}

export interface DefaulterReport {
  generatedAt: string;
  summary: { totalDefaulters: number; totalOutstandingPesewas: number };
  rows: DefaulterReportRow[];
}

export interface CollectorPerformanceReportRow {
  collectorId: string;
  collectorName: string;
  expectedPesewas: number;
  collectedPesewas: number;
  collectionRatePercent: number;
  missedBorrowers: number;
  reconciliationVariancePesewas: number;
}

export interface CollectorPerformanceReport {
  generatedAt: string;
  rows: CollectorPerformanceReportRow[];
}

export interface GroupRiskReportRow {
  groupId: string;
  groupName: string;
  community: string;
  collectionRatePercent: number;
  riskLevel: string;
  activeMemberCount: number;
  memberCount: number;
}

export interface GroupRiskReport {
  generatedAt: string;
  rows: GroupRiskReportRow[];
}

export interface FinancialLedgerReportParams {
  fromDate?: string;
  toDate?: string;
}

export interface FinancialLedgerReportRow {
  id: string;
  type: string;
  borrowerId: string;
  loanId?: string;
  amountPesewas: number;
  collectorId: string;
  recordedAt: string;
}

export interface FinancialLedgerReport {
  generatedAt: string;
  rows: FinancialLedgerReportRow[];
}

export type ReportCategory = 'collection' | 'portfolio' | 'risk' | 'compliance' | 'operations';

export interface ScheduledReportEntry {
  id: string;
  title: string;
  scheduleLabel: string;
}

export interface RecentExportEntry {
  id: string;
  label: string;
}

export interface ReportsHubMetadata {
  scheduledReports: ScheduledReportEntry[];
  recentExports: RecentExportEntry[];
  lastComplianceExport: {
    exportedAt: string;
    exportedBy: string;
  };
  categoryBreakdown: ReportsCategoryBreakdownEntry[];
}

export interface ReportsCategoryBreakdownEntry {
  id: ReportCategory;
  label: string;
  count: number;
}
