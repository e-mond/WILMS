import { useQuery } from '@tanstack/react-query';
import { PERMISSION } from '@/constants/permissions';
import { usePermission } from '@/hooks/usePermissions';
import { dashboardService } from '@/services';

export const dashboardSummaryQueryKey = ['dashboard', 'summary'] as const;

export function useDashboardSummary() {
  const canViewDashboard = usePermission(PERMISSION.ACCESS_ADMIN_PORTAL);

  return useQuery({
    queryKey: dashboardSummaryQueryKey,
    queryFn: () => dashboardService.getDashboardSummary(),
    enabled: canViewDashboard,
  });
}
