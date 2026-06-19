import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/services';

export function useDefaulterReport() {
  return useQuery({
    queryKey: ['reports', 'defaulters'] as const,
    queryFn: () => reportService.getDefaulterReport(),
  });
}
