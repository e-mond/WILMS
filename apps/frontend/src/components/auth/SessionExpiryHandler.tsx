'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  handleClientSessionExpiry,
  shouldWatchSessionExpiry,
} from '@/lib/auth/client-session-expiry';
import { setUnauthorizedHandler } from '@/lib/auth/unauthorized-handler';
import { useAuthStore } from '@/state/authStore';

export function SessionExpiryHandler() {
  const pathname = usePathname();
  const expiresAt = useAuthStore((state) => state.expiresAt);
  const isExpired = useAuthStore((state) => state.isExpired);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void handleClientSessionExpiry(window.location.pathname);
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, []);

  useEffect(() => {
    if (!shouldWatchSessionExpiry(pathname, expiresAt) || !expiresAt) {
      return;
    }

    const millisecondsUntilExpiry = expiresAt - Date.now();

    if (millisecondsUntilExpiry <= 0) {
      void handleClientSessionExpiry(pathname);
      return;
    }

    const timerId = window.setTimeout(() => {
      void handleClientSessionExpiry(pathname);
    }, millisecondsUntilExpiry);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [expiresAt, pathname]);

  useEffect(() => {
    if (isExpired && !pathname.startsWith('/session-expired')) {
      void handleClientSessionExpiry(pathname);
    }
  }, [isExpired, pathname]);

  return null;
}
