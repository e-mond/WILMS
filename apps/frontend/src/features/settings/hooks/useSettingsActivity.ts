import { useQuery } from '@tanstack/react-query';
import { settingsService } from '@/services';

export function settingsActivityQueryKey() {
  return ['settings', 'activity'] as const;
}

export function useSettingsActivity() {
  return useQuery({
    queryKey: settingsActivityQueryKey(),
    queryFn: () => settingsService.getSettingsActivity(),
  });
}
