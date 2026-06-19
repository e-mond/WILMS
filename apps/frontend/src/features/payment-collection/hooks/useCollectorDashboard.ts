import { useQuery } from '@tanstack/react-query';
import { collectorService } from '@/services';

export function collectorDashboardQueryKey(collectorId: string, date?: string) {
  return ['collector', collectorId, 'dashboard', date ?? 'today'] as const;
}

export function useCollectorDashboard(collectorId: string | undefined, date?: string) {
  return useQuery({
    queryKey: collectorId ? collectorDashboardQueryKey(collectorId, date) : ['collector', 'dashboard'],
    queryFn: () => collectorService.getDashboard(collectorId!, date),
    enabled: Boolean(collectorId),
  });
}
