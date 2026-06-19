import { useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '@/services';
import type { UpdateSystemSettingsInput } from '@/types/settings';
import { settingsQueryKey } from '@/features/settings/hooks/useSettings';

export function useUpdateSystemSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateSystemSettingsInput) => settingsService.updateSettings(input),
    onSuccess: (data) => {
      queryClient.setQueryData(settingsQueryKey(), data);
    },
  });
}
