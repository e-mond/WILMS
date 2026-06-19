import { useQuery } from '@tanstack/react-query';
import { collectorManagementService } from '@/services';

export function collectorQueryKey(id: string) {
  return ['collectors', id] as const;
}

export function useCollector(id: string | undefined) {
  return useQuery({
    queryKey: id ? collectorQueryKey(id) : ['collectors', 'detail'],
    queryFn: () => collectorManagementService.getCollector(id!),
    enabled: Boolean(id),
  });
}
