'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AppLockOverlay } from '@/features/app-lock/components/AppLockOverlay';
import {
  APP_LOCK_ACTIVITY_EVENTS,
  APP_LOCK_IDLE_MS,
  APP_LOCK_POST_LOGIN_GRACE_MS,
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
  const sessionStartedAt = useAppLockStore((state) => state.sessionStartedAt);
  const idleTimeoutMs = useAppLockStore((state) => state.idleTimeoutMs);
  const recordActivity = useAppLockStore((state) => state.recordActivity);
  const lock = useAppLockStore((state) => state.lock);
  const unlock = useAppLockStore((state) => state.unlock);
  const syncUser = useAppLockStore((state) => state.syncUser);

  const effectiveIdleMs =
    typeof window !== 'undefined' &&
    typeof (window as typeof window & { __WILMS_E2E_APP_LOCK_IDLE_MS?: number })
      .__WILMS_E2E_APP_LOCK_IDLE_MS === 'number'
      ? (window as typeof window & { __WILMS_E2E_APP_LOCK_IDLE_MS?: number })
          .__WILMS_E2E_APP_LOCK_IDLE_MS!
      : idleTimeoutMs || APP_LOCK_IDLE_MS;

  const shouldWatch =
    isHydrated &&
    isStoreHydrated &&
    isAuthenticated &&
    isEnabled &&
    !isPublicPath(pathname);

  useEffect(() => {
    if (!isHydrated || !user?.id) {
      return;
    }

    syncUser(user.id);
  }, [isHydrated, syncUser, user?.id]);

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

    if (Date.now() - sessionStartedAt < APP_LOCK_POST_LOGIN_GRACE_MS) {
      return;
    }

    const elapsed = Date.now() - lastActivityAt;
    const delay = Math.max(effectiveIdleMs - elapsed, 0);

    const timerId = window.setTimeout(() => {
      lock();
    }, delay);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [
    effectiveIdleMs,
    isLocked,
    lastActivityAt,
    lock,
    sessionStartedAt,
    shouldWatch,
  ]);

  useEffect(() => {
    if (!shouldWatch) {
      return;
    }

    const maybeLockAfterBackground = () => {
      const state = useAppLockStore.getState();
      if (Date.now() - state.sessionStartedAt < APP_LOCK_POST_LOGIN_GRACE_MS) {
        return;
      }

      const elapsed = Date.now() - state.lastActivityAt;
      if (elapsed < (state.idleTimeoutMs || APP_LOCK_IDLE_MS)) {
        return;
      }

      lock();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        maybeLockAfterBackground();
        return;
      }
      if (document.visibilityState === 'visible') {
        maybeLockAfterBackground();
      }
    };

    const handlePageHide = () => {
      maybeLockAfterBackground();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [lock, shouldWatch]);

  if (!shouldWatch || !isLocked) {
    return null;
  }

  return <AppLockOverlay />;
}
