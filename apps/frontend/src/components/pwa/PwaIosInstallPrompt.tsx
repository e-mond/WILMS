'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PWA_INSTALL_DISMISS_KEY } from '@/constants/pwa';

function isIosSafari(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const ua = window.navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua);
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone);

  return isIos && !isStandalone;
}

export function PwaIosInstallPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const dismissed = window.localStorage.getItem(`${PWA_INSTALL_DISMISS_KEY}:ios`) === 'true';
    setVisible(isIosSafari() && !dismissed);
  }, []);

  const dismiss = useCallback(() => {
    window.localStorage.setItem(`${PWA_INSTALL_DISMISS_KEY}:ios`, 'true');
    setVisible(false);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="border-b border-border bg-muted px-wilms-4 py-wilms-3 text-text-primary"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-wilms-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-body">
          Install WILMS on iOS: tap Share, then <span className="font-semibold">Add to Home Screen</span>.
        </p>
        <Button type="button" variant="secondary" size="sm" onClick={dismiss}>
          Got it
        </Button>
      </div>
    </div>
  );
}
