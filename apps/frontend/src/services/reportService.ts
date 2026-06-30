import type {
  DailyCollectionReportParams,
  DailyCollectionReport,
  FinancialLedgerReportParams,
  LoanPortfolioReportParams,
} from '@/types/reports';
import type { IReportService } from '@/types/services';
import { apiClient } from '@/utils/apiClient';
import { normalizeDailyCollectionReport } from '@/utils/daily-collection-report';

const reportService: IReportService = {
  listAvailableReports() {
    return apiClient.get('/reports');
  },

  getReportsHubMetadata() {
    return apiClient.get('/reports/hub');
  },

  getLoanPortfolioReport(params?: LoanPortfolioReportParams) {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.cycleBatch) searchParams.set('cycleBatch', params.cycleBatch);
    const query = searchParams.toString();
    return apiClient.get(`/reports/loan-portfolio${query ? `?${query}` : ''}`);
  },

  getDailyCollectionReport(params: DailyCollectionReportParams) {
    const searchParams = new URLSearchParams({ date: params.date });
    if (params.collectorId) searchParams.set('collectorId', params.collectorId);
    return apiClient
      .get<Partial<DailyCollectionReport> & { date?: string; totalPesewas?: number }>(
        `/reports/daily-collection?${searchParams.toString()}`,
      )
      .then((payload) => normalizeDailyCollectionReport(payload, params.date));
  },

  getDefaulterReport() {
    return apiClient.get('/reports/defaulters');
  },

  getCollectorPerformanceReport() {
    return apiClient.get('/reports/collector-performance');
  },

  getGroupRiskReport() {
    return apiClient.get('/reports/group-risk');
  },

  getFinancialLedgerReport(params?: FinancialLedgerReportParams) {
    const searchParams = new URLSearchParams();
    if (params?.fromDate) searchParams.set('fromDate', params.fromDate);
    if (params?.toDate) searchParams.set('toDate', params.toDate);
    const query = searchParams.toString();
    return apiClient.get(`/reports/financial-ledger${query ? `?${query}` : ''}`);
  },
};

export default reportService;
