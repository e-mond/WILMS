'use client';

import { useEffect, useState } from 'react';
import { enablePushSubscription } from '@/features/notifications/enablePushSubscription';
import { PushSubscribePrompt } from '@/features/notifications/components/PushSubscribePrompt';
import { USE_MOCK_SERVICES } from '@/config/api';
import { USER_ROLE } from '@/constants/roles';
import { useAuth } from '@/hooks/useAuth';
import { useIsAuthRoute } from '@/hooks/useIsAuthRoute';

function isStandaloneDisplayMode(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator &&
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

/**
 * Automatically subscribes Super Admins / installed PWA sessions when the
 * browser already granted notification permission. Shows a compact failure
 * CTA only when automatic activation cannot complete.
 */
export function PushDefaultSubscribeBanner() {
  const { user, isAuthenticated, isHydrated } = useAuth();
  const isAuthRoute = useIsAuthRoute();
  const [showFailure, setShowFailure] = useState(false);

  useEffect(() => {
    if (!isHydrated || !isAuthenticated || !user || isAuthRoute || USE_MOCK_SERVICES) {
      setShowFailure(false);
      return;
    }

    const isSuperAdmin = user.role === USER_ROLE.SUPER_ADMIN;
    const installed = isStandaloneDisplayMode();
    if (!isSuperAdmin && !installed) {
      setShowFailure(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      const result = await enablePushSubscription({ requestPermission: false });
      if (cancelled) {
        return;
      }
      if (result.ok) {
        setShowFailure(false);
        return;
      }
      // Permission still default: wait for a gesture elsewhere; only surface hard failures.
      if (result.reason === 'vapid_missing' || result.reason === 'error') {
        setShowFailure(true);
      } else if (
        result.reason === 'permission_denied' &&
        typeof Notification !== 'undefined' &&
        Notification.permission === 'denied'
      ) {
        setShowFailure(true);
      } else {
        setShowFailure(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthRoute, isAuthenticated, isHydrated, user]);

  if (!showFailure) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Push notification status"
      className="border-b border-border bg-card px-wilms-4 py-wilms-3"
      data-testid="push-default-subscribe-banner"
    >
      <div className="mx-auto max-w-3xl">
        <PushSubscribePrompt autoEnableWhenGranted hideMarketingCopy />
      </div>
    </div>
  );
}
