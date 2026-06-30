import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '@/services';
import type { UpdateSettingsMeInput } from '@/types/settings';

export function settingsMeQueryKey() {
  return ['settings', 'me'] as const;
}

export function useSettingsMe() {
  return useQuery({
    queryKey: settingsMeQueryKey(),
    queryFn: () => settingsService.getSettingsMe(),
  });
}

export function useUpdateSettingsMe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateSettingsMeInput) => settingsService.updateSettingsMe(input),
    onSuccess: (data) => {
      queryClient.setQueryData(settingsMeQueryKey(), data);
    },
  });
}
