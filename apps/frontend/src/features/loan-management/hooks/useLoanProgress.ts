import { useQuery } from '@tanstack/react-query';
import { loanService } from '@/services';

export function loanProgressQueryKey(loanId: string) {
  return ['loans', loanId, 'progress'] as const;
}

export function useLoanProgress(loanId: string) {
  return useQuery({
    queryKey: loanProgressQueryKey(loanId),
    queryFn: () => loanService.getLoanProgress(loanId),
    enabled: Boolean(loanId),
  });
}
