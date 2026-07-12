export const APP_LOCK_STORAGE_KEY = 'wilms-app-lock';

export const APP_LOCK_PIN_LENGTH = 6;

export const APP_LOCK_MAX_ATTEMPTS = 5;

const configuredIdleMs = Number(process.env.NEXT_PUBLIC_APP_LOCK_IDLE_MS);

function resolveAppLockIdleMs(): number {
  if (typeof window !== 'undefined') {
    const e2eOverride = (
      window as typeof window & { __WILMS_E2E_APP_LOCK_IDLE_MS?: number }
    ).__WILMS_E2E_APP_LOCK_IDLE_MS;

    if (typeof e2eOverride === 'number' && e2eOverride > 0) {
      return e2eOverride;
    }
  }

  return Number.isFinite(configuredIdleMs) && configuredIdleMs > 0
    ? configuredIdleMs
    : 9 * 60 * 1000;
}

/** Idle time before the lock screen appears (field device security). */
export const APP_LOCK_IDLE_MS = resolveAppLockIdleMs();

function resolveAppLockPostLoginGraceMs(): number {
  if (typeof window !== 'undefined') {
    const e2eOverride = (
      window as typeof window & { __WILMS_E2E_APP_LOCK_POST_LOGIN_GRACE_MS?: number }
    ).__WILMS_E2E_APP_LOCK_POST_LOGIN_GRACE_MS;

    if (typeof e2eOverride === 'number' && e2eOverride >= 0) {
      return e2eOverride;
    }
  }

  return 60_000;
}

/** Grace period after sign-in or unlock before idle lock can trigger. */
export const APP_LOCK_POST_LOGIN_GRACE_MS = resolveAppLockPostLoginGraceMs();

export const APP_LOCK_ACTIVITY_EVENTS = [
  'pointerdown',
  'keydown',
  'touchstart',
  'scroll',
] as const;
