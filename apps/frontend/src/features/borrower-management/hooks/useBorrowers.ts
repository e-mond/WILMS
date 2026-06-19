import { useQuery } from '@tanstack/react-query';
import { borrowerService } from '@/services';

export const borrowersQueryKey = ['borrowers', 'list'] as const;

export function useBorrowers() {
  return useQuery({
    queryKey: borrowersQueryKey,
    queryFn: () => borrowerService.listBorrowers(),
  });
}
