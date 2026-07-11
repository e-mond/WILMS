'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PWA_INSTALL_DISMISS_KEY } from '@/constants/pwa';
import { useIsAuthRoute } from '@/hooks/useIsAuthRoute';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallBanner() {
  const isAuthRoute = useIsAuthRoute();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const dismissed = window.localStorage.getItem(PWA_INSTALL_DISMISS_KEY) === 'true';
    setIsDismissed(dismissed);

    const onBeforeInstallPrompt = (event: Event) => {
      if (window.localStorage.getItem(PWA_INSTALL_DISMISS_KEY) === 'true') {
        return;
      }

      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setIsDismissed(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    };
  }, []);

  const dismiss = useCallback(() => {
    window.localStorage.setItem(PWA_INSTALL_DISMISS_KEY, 'true');
    setIsDismissed(true);
    setDeferredPrompt(null);
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    dismiss();
  }, [deferredPrompt, dismiss]);

  if (isAuthRoute || isDismissed || !deferredPrompt) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="border-b border-border bg-brand-primary-light px-wilms-4 py-wilms-3 text-text-primary"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-wilms-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-body">
          Install WILMS on this device for faster field access and offline payment sync.
        </p>
        <div className="flex shrink-0 gap-wilms-2">
          <Button type="button" variant="secondary" size="sm" onClick={dismiss}>
            Not now
          </Button>
          <Button type="button" size="sm" onClick={() => void install()}>
            Install
          </Button>
        </div>
      </div>
    </div>
  );
}
