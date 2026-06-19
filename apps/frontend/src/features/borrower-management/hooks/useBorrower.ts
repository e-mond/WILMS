import { useQuery } from '@tanstack/react-query';
import { borrowerService } from '@/services';

export function borrowerQueryKey(borrowerId: string) {
  return ['borrowers', borrowerId] as const;
}

export function useBorrower(borrowerId: string) {
  return useQuery({
    queryKey: borrowerQueryKey(borrowerId),
    queryFn: () => borrowerService.getBorrower(borrowerId),
    enabled: Boolean(borrowerId),
  });
}
