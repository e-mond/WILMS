'use client';

import { useQuery } from '@tanstack/react-query';
import { collectorService } from '@/services';
import { useAuth } from '@/hooks/useAuth';

export function collectorBorrowersQueryKey(collectorId?: string, date?: string) {
  return ['collector', 'borrowers', collectorId, date] as const;
}

export function useCollectorBorrowers(referenceDate?: string) {
  const { user } = useAuth();
  const date = referenceDate ?? new Date().toISOString().slice(0, 10);

  return useQuery({
    queryKey: collectorBorrowersQueryKey(user?.id, date),
    queryFn: () => collectorService.listAssignedBorrowers(user!.id, date),
    enabled: Boolean(user?.id),
    gcTime: 1000 * 60 * 60 * 24,
  });
}
