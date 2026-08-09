export const APP_LOCK_STORAGE_KEY = 'wilms-app-lock';

export const APP_LOCK_PIN_LENGTH = 6;

export const APP_LOCK_MAX_ATTEMPTS = 5;

export const APP_LOCK_IDLE_TIMEOUT_OPTIONS_MS = [
  60_000,
  3 * 60_000,
  5 * 60_000,
  9 * 60_000,
  15 * 60_000,
] as const;

export type AppLockIdleTimeoutMs = (typeof APP_LOCK_IDLE_TIMEOUT_OPTIONS_MS)[number];

export const APP_LOCK_DEFAULT_IDLE_MS: AppLockIdleTimeoutMs = 9 * 60_000;

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
    : APP_LOCK_DEFAULT_IDLE_MS;
}

/** Idle time before the lock screen appears (field device security). Prefer store value when set. */
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
