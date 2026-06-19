'use client';

import { useQuery } from '@tanstack/react-query';
import { loanService } from '@/services';

export const loanPortfolioQueryKey = ['loans', 'portfolio'] as const;

export function useLoanPortfolio() {
  return useQuery({
    queryKey: loanPortfolioQueryKey,
    queryFn: () => loanService.listPortfolioEntries(),
  });
}
