'use client';

import { buildSessionExpiredUrl } from '@/lib/auth/session-expiry';
import { isPublicPath } from '@/lib/auth/routes';
import { useAuthStore } from '@/state/authStore';

let expiryInFlight = false;

export async function handleClientSessionExpiry(nextPath?: string | null): Promise<void> {
  if (expiryInFlight || typeof window === 'undefined') {
    return;
  }

  const destination = buildSessionExpiredUrl(nextPath ?? window.location.pathname);

  if (window.location.pathname.startsWith(destination.split('?')[0] ?? '/session-expired')) {
    return;
  }

  expiryInFlight = true;
  useAuthStore.getState().markSessionExpired();

  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Redirect even if logout request fails.
  }

  window.location.assign(destination);
}

export function shouldWatchSessionExpiry(pathname: string, expiresAt: number | null): boolean {
  return Boolean(expiresAt) && !isPublicPath(pathname);
}
