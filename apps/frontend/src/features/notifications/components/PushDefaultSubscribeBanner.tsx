'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PushSubscribePrompt } from '@/features/notifications/components/PushSubscribePrompt';
import { USE_MOCK_SERVICES } from '@/config/api';
import { PWA_PUSH_PROMPT_DISMISS_KEY } from '@/constants/pwa';
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
 * Surfaces the push subscribe CTA for Super Admins and users running the
 * installed PWA. Prefs default to pushEnabled=true; this closes the gap to an
 * actual browser subscription without inventing a silent permission grant.
 */
export function PushDefaultSubscribeBanner() {
  const { user, isAuthenticated, isHydrated } = useAuth();
  const isAuthRoute = useIsAuthRoute();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isHydrated || !isAuthenticated || !user || isAuthRoute || USE_MOCK_SERVICES) {
      setVisible(false);
      return;
    }

    const dismissed = window.localStorage.getItem(PWA_PUSH_PROMPT_DISMISS_KEY) === 'true';
    if (dismissed) {
      setVisible(false);
      return;
    }

    const isSuperAdmin = user.role === USER_ROLE.SUPER_ADMIN;
    const installed = isStandaloneDisplayMode();
    setVisible(isSuperAdmin || installed);
  }, [isAuthRoute, isAuthenticated, isHydrated, user]);

  if (!visible) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Enable push notifications"
      className="border-b border-border bg-card px-wilms-4 py-wilms-3"
      data-testid="push-default-subscribe-banner"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-wilms-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-wilms-2">
          <p className="text-small font-semibold text-text-primary">
            Keep push notifications enabled
          </p>
          <PushSubscribePrompt />
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="shrink-0 self-start"
          onClick={() => {
            window.localStorage.setItem(PWA_PUSH_PROMPT_DISMISS_KEY, 'true');
            setVisible(false);
          }}
        >
          Not now
        </Button>
      </div>
    </div>
  );
}
