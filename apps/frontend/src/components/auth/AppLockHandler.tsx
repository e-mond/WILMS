'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AppLockOverlay } from '@/features/app-lock/components/AppLockOverlay';
import {
  APP_LOCK_ACTIVITY_EVENTS,
  APP_LOCK_IDLE_MS,
} from '@/constants/app-lock';
import { isPublicPath } from '@/lib/auth/routes';
import { useAuth } from '@/hooks/useAuth';
import { useAppLockStore } from '@/state/appLockStore';

export function AppLockHandler() {
  const pathname = usePathname();
  const { user, isAuthenticated, isHydrated } = useAuth();
  const isEnabled = useAppLockStore((state) => state.isEnabled);
  const isLocked = useAppLockStore((state) => state.isLocked);
  const isStoreHydrated = useAppLockStore((state) => state.isHydrated);
  const lastActivityAt = useAppLockStore((state) => state.lastActivityAt);
  const recordActivity = useAppLockStore((state) => state.recordActivity);
  const lock = useAppLockStore((state) => state.lock);
  const unlock = useAppLockStore((state) => state.unlock);
  const syncUser = useAppLockStore((state) => state.syncUser);

  const shouldWatch =
    isHydrated &&
    isStoreHydrated &&
    isAuthenticated &&
    isEnabled &&
    !isPublicPath(pathname);

  useEffect(() => {
    syncUser(user?.id ?? null);
  }, [syncUser, user?.id]);

  useEffect(() => {
    if (!shouldWatch) {
      unlock();
    }
  }, [shouldWatch, unlock]);

  useEffect(() => {
    if (!shouldWatch) {
      return;
    }

    recordActivity();
  }, [pathname, recordActivity, shouldWatch]);

  useEffect(() => {
    if (!shouldWatch) {
      return;
    }

    const handleActivity = () => {
      recordActivity();
    };

    for (const eventName of APP_LOCK_ACTIVITY_EVENTS) {
      window.addEventListener(eventName, handleActivity, { passive: true });
    }

    return () => {
      for (const eventName of APP_LOCK_ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, handleActivity);
      }
    };
  }, [recordActivity, shouldWatch]);

  useEffect(() => {
    if (!shouldWatch || isLocked) {
      return;
    }

    const elapsed = Date.now() - lastActivityAt;
    const delay = Math.max(APP_LOCK_IDLE_MS - elapsed, 0);

    const timerId = window.setTimeout(() => {
      lock();
    }, delay);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [isLocked, lastActivityAt, lock, shouldWatch]);

  useEffect(() => {
    if (!shouldWatch) {
      return;
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        lock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [lock, shouldWatch]);

  if (!shouldWatch || !isLocked) {
    return null;
  }

  return <AppLockOverlay />;
}
