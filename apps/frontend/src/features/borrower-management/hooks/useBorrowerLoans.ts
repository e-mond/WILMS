import { useQuery } from '@tanstack/react-query';
import { loanService } from '@/services';

export function borrowerLoansQueryKey(borrowerId: string) {
  return ['borrowers', borrowerId, 'loans'] as const;
}

export function useBorrowerLoans(borrowerId: string) {
  return useQuery({
    queryKey: borrowerLoansQueryKey(borrowerId),
    queryFn: () => loanService.listBorrowerLoans(borrowerId),
    enabled: Boolean(borrowerId),
  });
}
