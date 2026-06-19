import { REPORT_CATEGORY_LABELS } from '@/constants/report-display';
import { REPORT_CATALOG } from '@/mocks/reports-catalog';
import { MOCK_REPORTS_HUB } from '@/mocks/reports-hub';
import type { IReportService, ReportSummary } from '@/types/services';
import type {
  DailyCollectionReportParams,
  FinancialLedgerReportParams,
  LoanPortfolioReportParams,
  ReportCategory,
} from '@/types/reports';
import groupServiceMock from '@/services/mock/groupService.mock';
import loanServiceMock from '@/services/mock/loanService.mock';
import { getFinancialTransactions } from '@/services/mock/transaction-log.store';
import { simulateDelay } from '@/services/mock/delay';
import {
  buildDailyCollectionReport,
  extractRepaymentsFromTransactions,
} from '@/utils/daily-collection-report';
import { buildCollectorPerformanceReport } from '@/utils/collector-performance-report';
import { buildDefaulterReport } from '@/utils/defaulter-report';
import { buildFinancialLedgerReport } from '@/utils/financial-ledger-report';
import { buildGroupRiskReport } from '@/utils/group-risk-report';
import { buildLoanPortfolioReport } from '@/utils/loan-portfolio-report';

const MOCK_REPORTS: ReportSummary[] = REPORT_CATALOG.map((entry) => ({ ...entry }));

function buildCategoryBreakdown() {
  const counts = REPORT_CATALOG.reduce(
    (accumulator, entry) => {
      accumulator[entry.category] = (accumulator[entry.category] ?? 0) + 1;
      return accumulator;
    },
    {} as Record<ReportCategory, number>,
  );

  return (Object.keys(REPORT_CATEGORY_LABELS) as ReportCategory[]).map((category) => ({
    id: category,
    label: REPORT_CATEGORY_LABELS[category],
    count: counts[category] ?? 0,
  }));
}

const reportServiceMock: IReportService = {
  async listAvailableReports(): Promise<ReportSummary[]> {
    await simulateDelay();
    return MOCK_REPORTS.map((entry) => ({ ...entry }));
  },

  async getReportsHubMetadata() {
    await simulateDelay();
    return {
      ...MOCK_REPORTS_HUB,
      scheduledReports: [...MOCK_REPORTS_HUB.scheduledReports],
      recentExports: [...MOCK_REPORTS_HUB.recentExports],
      categoryBreakdown: buildCategoryBreakdown(),
    };
  },

  async getLoanPortfolioReport(params?: LoanPortfolioReportParams) {
    await simulateDelay();
    const entries = await loanServiceMock.listPortfolioEntries();
    return buildLoanPortfolioReport(entries, params);
  },

  async getDailyCollectionReport(params: DailyCollectionReportParams) {
    await simulateDelay();
    const loans = await loanServiceMock.listPortfolioEntries();
    const repayments = extractRepaymentsFromTransactions(
      getFinancialTransactions(),
      params.date,
    );
    return buildDailyCollectionReport({
      date: params.date,
      loans,
      repayments,
      collectorId: params.collectorId,
    });
  },

  async getDefaulterReport() {
    await simulateDelay();
    return buildDefaulterReport();
  },

  async getCollectorPerformanceReport() {
    await simulateDelay();
    return buildCollectorPerformanceReport(getFinancialTransactions());
  },

  async getGroupRiskReport() {
    await simulateDelay();
    const groups = await groupServiceMock.listGroups();
    return buildGroupRiskReport(groups.groups);
  },

  async getFinancialLedgerReport(params?: FinancialLedgerReportParams) {
    await simulateDelay();
    return buildFinancialLedgerReport(getFinancialTransactions(), params);
  },
};

export default reportServiceMock;
