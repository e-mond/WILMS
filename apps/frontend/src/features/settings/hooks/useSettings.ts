import { useQuery } from '@tanstack/react-query';
import { settingsService } from '@/services';

export function settingsQueryKey() {
  return ['settings'] as const;
}

export function useSettings() {
  return useQuery({
    queryKey: settingsQueryKey(),
    queryFn: () => settingsService.getSettings(),
  });
}
