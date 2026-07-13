const CHUNK_RECOVERY_KEY = 'wilms-chunk-recovery-attempted';

const CHUNK_ERROR_PATTERNS = [
  'ChunkLoadError',
  'Loading chunk',
  'Failed to fetch dynamically imported module',
  'Importing a module script failed',
  'error loading dynamically imported module',
] as const;

export function isChunkLoadError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  const name = error instanceof Error ? error.name : '';
  const message = error instanceof Error ? error.message : String(error);

  return CHUNK_ERROR_PATTERNS.some(
    (pattern) =>
      name.includes(pattern) || message.toLowerCase().includes(pattern.toLowerCase()),
  );
}

/**
 * Reload once per browser tab when a stale JS chunk is detected after deploy.
 * Returns true when a reload was triggered.
 */
export function attemptChunkRecovery(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    if (window.sessionStorage.getItem(CHUNK_RECOVERY_KEY) === '1') {
      return false;
    }

    window.sessionStorage.setItem(CHUNK_RECOVERY_KEY, '1');
    window.location.reload();
    return true;
  } catch {
    window.location.reload();
    return true;
  }
}

export function clearChunkRecoveryAttempt(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.removeItem(CHUNK_RECOVERY_KEY);
  } catch {
    // Ignore storage failures.
  }
}
