import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services';

export const dashboardSummaryQueryKey = ['dashboard', 'summary'] as const;

export function useDashboardSummary() {
  return useQuery({
    queryKey: dashboardSummaryQueryKey,
    queryFn: () => dashboardService.getDashboardSummary(),
  });
}
