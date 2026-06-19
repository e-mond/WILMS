'use client';

import { useQuery } from '@tanstack/react-query';
import { transactionService } from '@/services';

export function adminFeeStatusQueryKey(borrowerId: string) {
  return ['borrowers', borrowerId, 'admin-fee-status'] as const;
}

export function useAdminFeeStatus(borrowerId: string) {
  return useQuery({
    queryKey: adminFeeStatusQueryKey(borrowerId),
    queryFn: () => transactionService.getAdminFeeStatus(borrowerId),
  });
}
