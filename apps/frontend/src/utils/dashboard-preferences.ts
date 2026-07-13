const STORAGE_PREFIX = 'wilms-dashboard';

function preferenceKey(userId: string | undefined, key: string): string | null {
  if (!userId?.trim()) {
    return null;
  }

  return `${STORAGE_PREFIX}:${userId}:${key}`;
}

/** Read a persisted dashboard preference (survives refresh and re-login for the same user). */
export function readDashboardPreference(
  userId: string | undefined,
  key: string,
  fallback: string,
): string {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const storageKey = preferenceKey(userId, key);
  if (!storageKey) {
    return fallback;
  }

  const stored = localStorage.getItem(storageKey);
  if (stored) {
    return stored;
  }

  const legacySession = sessionStorage.getItem(`wilms-dashboard-${key}`);
  if (legacySession) {
    localStorage.setItem(storageKey, legacySession);
    sessionStorage.removeItem(`wilms-dashboard-${key}`);
    return legacySession;
  }

  return fallback;
}

export function writeDashboardPreference(
  userId: string | undefined,
  key: string,
  value: string,
): void {
  if (typeof window === 'undefined') {
    return;
  }

  const storageKey = preferenceKey(userId, key);
  if (!storageKey) {
    return;
  }

  localStorage.setItem(storageKey, value);
}
