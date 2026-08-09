import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PERMISSION } from '@/constants/permissions';
import { usePermission } from '@/hooks/usePermissions';
import { dashboardService } from '@/services';
import {
  OFFLINE_CACHE_KEYS,
  readOfflineSnapshot,
  writeOfflineSnapshot,
} from '@/lib/offline/offlineSnapshotStore';

export const dashboardSummaryQueryKey = ['dashboard', 'summary'] as const;

export function useDashboardSummary() {
  const canViewDashboard = usePermission(PERMISSION.ACCESS_ADMIN_PORTAL);

  const query = useQuery({
    queryKey: dashboardSummaryQueryKey,
    queryFn: async () => {
      try {
        const data = await dashboardService.getDashboardSummary();
        void writeOfflineSnapshot(OFFLINE_CACHE_KEYS.dashboardSummary, data);
        return data;
      } catch (error) {
        const cached = await readOfflineSnapshot<Awaited<
          ReturnType<typeof dashboardService.getDashboardSummary>
        >>(OFFLINE_CACHE_KEYS.dashboardSummary);
        if (cached) {
          return cached.value;
        }
        throw error;
      }
    },
    enabled: canViewDashboard,
  });

  useEffect(() => {
    if (!canViewDashboard || query.data) {
      return;
    }
    void readOfflineSnapshot(OFFLINE_CACHE_KEYS.dashboardSummary).then((cached) => {
      if (cached && !query.data) {
        // Seed is handled by queryFn fallback; this warms IndexedDB availability.
      }
    });
  }, [canViewDashboard, query.data]);

  return query;
}
