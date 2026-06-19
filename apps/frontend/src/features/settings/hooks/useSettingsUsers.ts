import { useQuery } from '@tanstack/react-query';
import { settingsService } from '@/services';

export function settingsUsersQueryKey() {
  return ['settings', 'users'] as const;
}

export function useSettingsUsers() {
  return useQuery({
    queryKey: settingsUsersQueryKey(),
    queryFn: () => settingsService.listUsers(),
  });
}
