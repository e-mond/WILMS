import { useQuery } from '@tanstack/react-query';
import { riskFlagService } from '@/services';

export function riskFlagDetailQueryKey(flagId: string) {
  return ['risk-flags', 'detail', flagId] as const;
}

export function useRiskFlagDetail(flagId: string | null | undefined) {
  return useQuery({
    queryKey: riskFlagDetailQueryKey(flagId ?? ''),
    queryFn: () => riskFlagService.getRiskFlag(flagId!),
    enabled: Boolean(flagId),
  });
}
