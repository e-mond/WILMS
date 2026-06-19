import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/services';

export function useGroupRiskReport() {
  return useQuery({
    queryKey: ['reports', 'group-risk'] as const,
    queryFn: () => reportService.getGroupRiskReport(),
  });
}
