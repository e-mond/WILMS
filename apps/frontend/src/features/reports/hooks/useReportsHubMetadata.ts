import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/services';

export function reportsHubQueryKey() {
  return ['reports', 'hub'] as const;
}

export function useReportsHubMetadata() {
  return useQuery({
    queryKey: reportsHubQueryKey(),
    queryFn: () => reportService.getReportsHubMetadata(),
  });
}
