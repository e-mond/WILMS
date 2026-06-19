'use client';

import { useQuery } from '@tanstack/react-query';
import { settingsService } from '@/services';

export function useSettingsUserProfile(userId: string | null) {
  return useQuery({
    queryKey: ['settings', 'user-profile', userId],
    queryFn: () => settingsService.getUserProfile(userId!),
    enabled: Boolean(userId),
  });
}
