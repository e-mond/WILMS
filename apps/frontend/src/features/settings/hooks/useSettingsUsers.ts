import { useQuery } from '@tanstack/react-query';
import { PERMISSION } from '@/constants/permissions';
import { usePermission } from '@/hooks/usePermissions';
import { settingsService } from '@/services';

export function settingsUsersQueryKey() {
  return ['settings', 'users'] as const;
}

export function useSettingsUsers() {
  const canListUsers = usePermission(PERMISSION.VIEW_ALL_USERS);

  return useQuery({
    queryKey: settingsUsersQueryKey(),
    queryFn: () => settingsService.listUsers(),
    enabled: canListUsers,
  });
}
