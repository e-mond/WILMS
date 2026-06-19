'use client';

import { useQuery } from '@tanstack/react-query';
import { loanService } from '@/services';

export const eligibleBorrowersQueryKey = ['borrowers', 'loan-eligible'] as const;

export function useEligibleBorrowers() {
  return useQuery({
    queryKey: eligibleBorrowersQueryKey,
    queryFn: () => loanService.listEligibleBorrowers(),
  });
}
