import { useQuery } from '@tanstack/react-query';
import { loanService } from '@/services';

export function loanPaymentLogQueryKey(loanId: string) {
  return ['loans', loanId, 'payments'] as const;
}

export function useLoanPaymentLog(loanId: string) {
  return useQuery({
    queryKey: loanPaymentLogQueryKey(loanId),
    queryFn: () => loanService.listLoanPaymentLog(loanId),
    enabled: Boolean(loanId),
  });
}
