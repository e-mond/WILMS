import { roleSettingsPreferences } from '@/features/settings/utils/role-settings-preferences';
import { OFFLINE_SYNC_RETRY_INTERVAL_MS } from '@/constants/offline-queue';

const MIN_SYNC_INTERVAL_MS = 30_000;
const MAX_SYNC_INTERVAL_MS = 15 * 60_000;

export function resolveOfflineSyncIntervalMs(): number {
  if (!roleSettingsPreferences.getAutoSync()) {
    return MAX_SYNC_INTERVAL_MS;
  }

  const minutes = Number.parseInt(roleSettingsPreferences.getSyncInterval(), 10);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return OFFLINE_SYNC_RETRY_INTERVAL_MS;
  }

  const intervalMs = minutes * 60_000;
  return Math.min(Math.max(intervalMs, MIN_SYNC_INTERVAL_MS), MAX_SYNC_INTERVAL_MS);
}

export function isAutoSyncEnabled(): boolean {
  return roleSettingsPreferences.getAutoSync();
}

export function isLowDataModeEnabled(): boolean {
  return roleSettingsPreferences.getLowDataMode();
}

export function shouldPauseBackgroundSync(batterySaver: boolean, lowPowerMode: boolean): boolean {
  return batterySaver || lowPowerMode || !isAutoSyncEnabled();
}
