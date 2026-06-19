'use client';

import { useQuery } from '@tanstack/react-query';
import { transactionService } from '@/services';

export const awaitingAdminFeeQueryKey = ['borrowers', 'awaiting-admin-fee'] as const;

export function useBorrowersAwaitingAdminFee() {
  return useQuery({
    queryKey: awaitingAdminFeeQueryKey,
    queryFn: () => transactionService.listBorrowersAwaitingAdminFee(),
  });
}
