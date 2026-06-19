import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/services';

export function useCollectorPerformanceReport() {
  return useQuery({
    queryKey: ['reports', 'collector-performance'] as const,
    queryFn: () => reportService.getCollectorPerformanceReport(),
  });
}
