import { useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '@/services';
import { settingsUsersQueryKey } from '@/features/settings/hooks/useSettingsUsers';
import type { CreateSettingsUserInput, UpdateSettingsUserInput } from '@/types/settings';

export function useSettingsUserMutations() {
  const queryClient = useQueryClient();

  const invalidateUsers = () => queryClient.invalidateQueries({ queryKey: settingsUsersQueryKey() });

  const createUser = useMutation({
    mutationFn: (input: CreateSettingsUserInput) => settingsService.createUser(input),
    onSuccess: invalidateUsers,
  });

  const updateUser = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSettingsUserInput }) =>
      settingsService.updateUser(id, input),
    onSuccess: invalidateUsers,
  });

  const disableUser = useMutation({
    mutationFn: (id: string) => settingsService.disableUser(id),
    onSuccess: invalidateUsers,
  });

  const activateUser = useMutation({
    mutationFn: (id: string) => settingsService.activateUser(id),
    onSuccess: invalidateUsers,
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => settingsService.deleteUser(id),
    onSuccess: invalidateUsers,
  });

  return { createUser, updateUser, disableUser, activateUser, deleteUser };
}
