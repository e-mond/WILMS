import { useQuery } from '@tanstack/react-query';
import { groupService } from '@/services';

export const groupsQueryKey = ['groups'] as const;

export function useGroups() {
  return useQuery({
    queryKey: groupsQueryKey,
    queryFn: () => groupService.listGroups(),
  });
}
