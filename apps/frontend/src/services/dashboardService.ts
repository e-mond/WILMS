import type { DashboardSummary } from '@/types/dashboard';
import type { IDashboardService } from '@/types/services';
import { apiClient } from '@/utils/apiClient';

const dashboardService: IDashboardService = {
  getDashboardSummary(): Promise<DashboardSummary> {
    return apiClient.get<DashboardSummary>('/dashboard/summary');
  },
};

export default dashboardService;
