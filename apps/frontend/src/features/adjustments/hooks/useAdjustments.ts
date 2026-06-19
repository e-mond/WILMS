import { useQuery } from '@tanstack/react-query';
import { adjustmentService } from '@/services';

export function adjustmentsQueryKey() {
  return ['adjustments', 'pending'] as const;
}

export function useAdjustments() {
  return useQuery({
    queryKey: adjustmentsQueryKey(),
    queryFn: () => adjustmentService.listPendingAdjustments(),
  });
}
