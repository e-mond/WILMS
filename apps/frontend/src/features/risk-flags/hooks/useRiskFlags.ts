import { useQuery } from '@tanstack/react-query';
import { riskFlagService } from '@/services';

export const riskFlagsQueryKey = ['risk-flags'] as const;

export function useRiskFlags() {
  return useQuery({
    queryKey: riskFlagsQueryKey,
    queryFn: () => riskFlagService.listRiskFlags(),
  });
}
