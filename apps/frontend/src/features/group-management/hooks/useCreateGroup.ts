import { useMutation, useQueryClient } from '@tanstack/react-query';
import { groupService } from '@/services';
import { groupsQueryKey } from '@/features/group-management/hooks/useGroups';
import { useToast } from '@/hooks/useToast';
import type { CreateGroupInput } from '@/types/group';

export function useCreateGroup() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (input: CreateGroupInput) => groupService.createGroup(input),
    onSuccess: (group) => {
      void queryClient.invalidateQueries({ queryKey: groupsQueryKey });
      toast.success('Group created', { message: `${group.name} is now active.` });
    },
    onError: () => {
      toast.error('Unable to create group', { message: 'Try again shortly.' });
    },
  });
}
