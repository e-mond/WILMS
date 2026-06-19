import { useQuery } from '@tanstack/react-query';
import { loanPoolService } from '@/services';

export const loanPoolsQueryKey = ['loan-pools'] as const;

export function useLoanPools() {
  return useQuery({
    queryKey: loanPoolsQueryKey,
    queryFn: () => loanPoolService.listLoanPools(),
  });
}
