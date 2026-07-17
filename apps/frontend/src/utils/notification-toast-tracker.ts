const STORAGE_PREFIX = 'wilms-seen-notification-ids';

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`;
}

export function loadSeenNotificationIds(userId: string): Set<string> {
  if (typeof window === 'undefined') {
    return new Set();
  }

  try {
    const raw = sessionStorage.getItem(storageKey(userId));
    if (!raw) {
      return new Set();
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return new Set();
    }

    return new Set(parsed.filter((entry): entry is string => typeof entry === 'string'));
  } catch {
    return new Set();
  }
}

export function persistSeenNotificationIds(userId: string, ids: Set<string>): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const values = Array.from(ids).slice(-200);
    sessionStorage.setItem(storageKey(userId), JSON.stringify(values));
  } catch {
    // Ignore quota or privacy mode errors.
  }
}

export function clearSeenNotificationIds(userId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    sessionStorage.removeItem(storageKey(userId));
  } catch {
    // Ignore storage errors.
  }
}
