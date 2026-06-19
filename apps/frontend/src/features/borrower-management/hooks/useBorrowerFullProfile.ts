import { useQuery } from '@tanstack/react-query';
import { borrowerService } from '@/services';

export function borrowerFullProfileQueryKey(id: string) {
  return ['borrowers', id, 'full-profile'] as const;
}

export function useBorrowerFullProfile(borrowerId: string | undefined) {
  return useQuery({
    queryKey: borrowerId ? borrowerFullProfileQueryKey(borrowerId) : ['borrowers', 'full-profile'],
    queryFn: () => borrowerService.getBorrowerFullProfile(borrowerId!),
    enabled: Boolean(borrowerId),
  });
}
