'use client';

import { useQuery } from '@tanstack/react-query';
import { transactionService } from '@/services';
import { useAuth } from '@/hooks/useAuth';
import { USER_ROLE } from '@/constants/roles';

export const collectedAdminFeesQueryKey = (collectorId?: string) =>
  ['transactions', 'admin-fees', collectorId ?? 'all'] as const;

export function useCollectedAdminFees(options?: { scopedToCollector?: boolean }) {
  const { user } = useAuth();
  const collectorId =
    options?.scopedToCollector && user?.role === USER_ROLE.COLLECTOR ? user.id : undefined;

  return useQuery({
    queryKey: collectedAdminFeesQueryKey(collectorId),
    queryFn: () => transactionService.listCollectedAdminFees(collectorId ? { collectorId } : undefined),
  });
}
