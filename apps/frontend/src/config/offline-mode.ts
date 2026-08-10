/**
 * Client-visible offline-first expansion flag.
 * Default false — must match domain `WILMS_OFFLINE_MODE` / `WILMS_FLAG_OFFLINE_MODE`.
 * When false, new sprint behaviours (shell fallback, expanded caches, IDB queue migration)
 * stay disabled. Existing collector queues are unchanged.
 */
function parseBool(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined || raw.trim() === '') {
    return fallback;
  }
  const normalized = raw.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }
  return fallback;
}

export function isOfflineModeEnabled(
  envValue: string | undefined = process.env.NEXT_PUBLIC_WILMS_OFFLINE_MODE,
): boolean {
  return parseBool(envValue, false);
}
