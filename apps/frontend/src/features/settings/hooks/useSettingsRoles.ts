'use client';

import { useQuery } from '@tanstack/react-query';
import { settingsService } from '@/services';

export function useSettingsRoles() {
  return useQuery({
    queryKey: ['settings', 'roles'],
    queryFn: () => settingsService.listRoles(),
  });
}

export function useSettingsPermissions() {
  return useQuery({
    queryKey: ['settings', 'permissions'],
    queryFn: () => settingsService.listPermissions(),
  });
}
