import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/services';

export function reportsIndexQueryKey() {
  return ['reports', 'index'] as const;
}

export function useReportsIndex() {
  return useQuery({
    queryKey: reportsIndexQueryKey(),
    queryFn: () => reportService.listAvailableReports(),
  });
}
