'use client';

import { useQuery } from '@tanstack/react-query';
import { loanService } from '@/services';

export function disbursementEligibilityQueryKey(borrowerId: string) {
  return ['borrowers', borrowerId, 'disbursement-eligibility'] as const;
}

export function useDisbursementEligibility(borrowerId: string, enabled = true) {
  return useQuery({
    queryKey: disbursementEligibilityQueryKey(borrowerId),
    queryFn: () => loanService.getDisbursementEligibility(borrowerId),
    enabled,
  });
}
