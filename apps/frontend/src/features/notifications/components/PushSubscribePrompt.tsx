'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { enablePushSubscription } from '@/features/notifications/enablePushSubscription';
import notificationPreferencesService from '@/services/notificationPreferencesService';

export function PushSubscribePrompt({
  autoEnableWhenGranted = false,
  hideMarketingCopy = false,
}: {
  /** When permission is already granted, subscribe without showing a CTA. */
  autoEnableWhenGranted?: boolean;
  hideMarketingCopy?: boolean;
}) {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unavailableReason, setUnavailableReason] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setSupported('serviceWorker' in navigator && 'PushManager' in window);
    void notificationPreferencesService.getVapidPublicKey().then(({ publicKey }) => {
      if (!publicKey) {
        setUnavailableReason(
          'Push delivery is not configured on this environment (VAPID keys missing). In-app alerts still work.',
        );
      }
    });

    void (async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return;
      }
      try {
        const registration = await navigator.serviceWorker.getRegistration('/sw.js');
        const existing = await registration?.pushManager.getSubscription();
        if (existing) {
          setSubscribed(true);
          return;
        }
        if (autoEnableWhenGranted && Notification.permission === 'granted') {
          const result = await enablePushSubscription({ requestPermission: false });
          if (result.ok) {
            setSubscribed(true);
          } else if (result.reason === 'vapid_missing') {
            setUnavailableReason(result.message);
          }
        }
      } catch {
        // Ignore probe failures; user can still attempt enable.
      }
    })();
  }, [autoEnableWhenGranted]);

  async function enablePush() {
    if (!supported) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await enablePushSubscription({ requestPermission: true });
      if (result.ok) {
        setSubscribed(true);
        return;
      }
      if (result.reason === 'vapid_missing') {
        setUnavailableReason(result.message);
        return;
      }
      setErrorMessage(result.message);
    } finally {
      setLoading(false);
    }
  }

  if (!supported || subscribed) {
    return null;
  }

  if (hideMarketingCopy && !unavailableReason && !errorMessage && Notification.permission === 'granted') {
    return null;
  }

  return (
    <div className="rounded-sm border border-border bg-background p-wilms-4" data-tour="push-notifications">
      {!hideMarketingCopy ? (
        <p className="text-body text-text-primary">
          Enable browser push notifications for approvals, holiday status, sync conflicts, and
          reconciliation alerts.
        </p>
      ) : (
        <p className="text-body text-text-primary">
          Browser push could not be activated automatically.
        </p>
      )}
      {unavailableReason ? (
        <p className="mt-wilms-2 text-small text-text-muted">{unavailableReason}</p>
      ) : null}
      {errorMessage ? <p className="mt-wilms-2 text-small text-danger">{errorMessage}</p> : null}
      <Button
        type="button"
        size="sm"
        className="mt-wilms-3"
        disabled={loading || Boolean(unavailableReason)}
        onClick={() => void enablePush()}
      >
        {loading ? 'Enabling…' : 'Enable push notifications'}
      </Button>
    </div>
  );
}
