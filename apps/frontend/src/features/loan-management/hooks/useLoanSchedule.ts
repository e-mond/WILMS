'use client';

import { useQuery } from '@tanstack/react-query';
import { loanService } from '@/services';

export function loanScheduleQueryKey(loanId: string) {
  return ['loans', loanId, 'schedule'] as const;
}

export function useLoanSchedule(loanId: string) {
  return useQuery({
    queryKey: loanScheduleQueryKey(loanId),
    queryFn: () => loanService.getLoanSchedule(loanId),
    enabled: Boolean(loanId),
  });
}
