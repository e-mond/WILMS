'use client';

import { useQuery } from '@tanstack/react-query';
import { loanPoolService } from '@/services';

export const unassignedPoolGroupsQueryKey = ['loan-pools', 'unassigned-groups'] as const;

export function useUnassignedPoolGroups(enabled = true) {
  return useQuery({
    queryKey: unassignedPoolGroupsQueryKey,
    queryFn: () => loanPoolService.listUnassignedGroups(),
    enabled,
  });
}
