import { useQuery } from '@tanstack/react-query';
import { reconciliationService } from '@/services';

export function reconciliationQueryKey(collectorId: string, date: string) {
  return ['reconciliation', collectorId, date] as const;
}

export function useReconciliation(collectorId: string | undefined, date: string) {
  return useQuery({
    queryKey: collectorId ? reconciliationQueryKey(collectorId, date) : ['reconciliation'],
    queryFn: () => reconciliationService.getCollectorReconciliation(collectorId!, date),
    enabled: Boolean(collectorId && date),
  });
}
