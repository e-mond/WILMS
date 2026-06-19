import { useQuery } from '@tanstack/react-query';
import { groupService } from '@/services';

export function groupQueryKey(id: string) {
  return ['groups', id] as const;
}

export function useGroup(id: string | undefined) {
  return useQuery({
    queryKey: id ? groupQueryKey(id) : ['groups', 'detail'],
    queryFn: () => groupService.getGroup(id!),
    enabled: Boolean(id),
  });
}
