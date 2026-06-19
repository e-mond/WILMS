import { useQuery } from '@tanstack/react-query';
import { collectorManagementService } from '@/services';

export const collectorsManagementQueryKey = ['collectors', 'management'] as const;

export function useCollectorsManagement() {
  return useQuery({
    queryKey: collectorsManagementQueryKey,
    queryFn: () => collectorManagementService.listCollectors(),
  });
}
