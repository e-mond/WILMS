import { MOCK_SYSTEM_SETTINGS } from '@/mocks/settings';
import type { SystemSettings, UpdateSystemSettingsInput } from '@/types/settings';

let settingsState: SystemSettings = { ...MOCK_SYSTEM_SETTINGS };

export function getSystemSettingsStore(): SystemSettings {
  return { ...settingsState };
}

export function updateSystemSettingsStore(input: UpdateSystemSettingsInput): SystemSettings {
  settingsState = {
    ...settingsState,
    ...input,
    updatedAt: new Date().toISOString(),
  };

  return { ...settingsState };
}

export function resetSystemSettingsStore(): void {
  settingsState = { ...MOCK_SYSTEM_SETTINGS };
}
