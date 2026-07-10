'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CURRENT_RELEASE_NOTES } from '@/constants/release-notes';
import { getAppVersionLabel } from '@/lib/app-version';
import { usePwaUpdateStore } from '@/state/pwaUpdateStore';

const UPDATE_DISMISS_KEY = 'wilms-pwa-update-dismissed';

export function AppUpdatePrompt() {
  const updateAvailable = usePwaUpdateStore((state) => state.updateAvailable);
  const waitingWorker = usePwaUpdateStore((state) => state.waitingWorker);
  const clearUpdate = usePwaUpdateStore((state) => state.clearUpdate);
  const [isDismissed, setIsDismissed] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const dismissedVersion = window.sessionStorage.getItem(UPDATE_DISMISS_KEY);
    setIsDismissed(dismissedVersion === CURRENT_RELEASE_NOTES.version);
  }, [updateAvailable]);

  const dismiss = useCallback(() => {
    window.sessionStorage.setItem(UPDATE_DISMISS_KEY, CURRENT_RELEASE_NOTES.version);
    setIsDismissed(true);
    clearUpdate();
  }, [clearUpdate]);

  const applyUpdate = useCallback(() => {
    if (!waitingWorker || isUpdating) {
      return;
    }

    setIsUpdating(true);

    const onControllerChange = () => {
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange, { once: true });
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  }, [isUpdating, waitingWorker]);

  if (!updateAvailable || isDismissed) {
    return null;
  }

  const versionLabel = getAppVersionLabel() || `WILMS v${CURRENT_RELEASE_NOTES.version}`;

  return (
    <div
      role="dialog"
      aria-labelledby="wilms-update-title"
      aria-describedby="wilms-update-summary"
      className="fixed inset-x-wilms-4 bottom-wilms-4 z-[90] mx-auto max-w-lg rounded-sm border border-border bg-card p-wilms-4 shadow-lg sm:inset-x-auto sm:right-wilms-4"
    >
      <div className="flex items-start justify-between gap-wilms-3">
        <div className="flex min-w-0 items-start gap-wilms-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-brand-primary-light text-brand-primary">
            <RefreshCw className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p id="wilms-update-title" className="font-semibold text-text-primary">
              Update available
            </p>
            <p id="wilms-update-summary" className="mt-wilms-1 text-small text-text-muted">
              {CURRENT_RELEASE_NOTES.summary}
            </p>
            <p className="mt-wilms-1 text-[11px] font-semibold uppercase tracking-wide text-executive-gold">
              {versionLabel}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-sm p-wilms-1 text-text-muted hover:bg-background hover:text-text-primary"
          aria-label="Dismiss update notification"
          onClick={dismiss}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <ul className="mt-wilms-3 space-y-wilms-1 border-t border-border pt-wilms-3 text-small text-text-primary">
        {CURRENT_RELEASE_NOTES.highlights.map((item) => (
          <li key={item} className="flex gap-wilms-2">
            <span className="text-brand-primary" aria-hidden="true">
              •
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-wilms-4 flex flex-wrap justify-end gap-wilms-2">
        <Button type="button" variant="secondary" size="sm" onClick={dismiss}>
          Later
        </Button>
        <Button type="button" size="sm" disabled={isUpdating} onClick={applyUpdate}>
          {isUpdating ? 'Updating...' : 'Update now'}
        </Button>
      </div>
    </div>
  );
}
