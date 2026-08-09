'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import notificationPreferencesService from '@/services/notificationPreferencesService';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushSubscribePrompt() {
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
  }, []);

  async function enablePush() {
    if (!supported) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const { publicKey } = await notificationPreferencesService.getVapidPublicKey();
      if (!publicKey) {
        setUnavailableReason(
          'Push delivery is not configured on this environment (VAPID keys missing). In-app alerts still work.',
        );
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setErrorMessage('Notification permission was not granted.');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await notificationPreferencesService.subscribePush(subscription.toJSON());
      setSubscribed(true);
    } catch (error) {
      console.error('[push] subscribe failed', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to enable push notifications.');
    } finally {
      setLoading(false);
    }
  }

  if (!supported || subscribed) {
    return null;
  }

  return (
    <div className="rounded-sm border border-border bg-background p-wilms-4" data-tour="push-notifications">
      <p className="text-body text-text-primary">
        Enable browser push notifications for approvals, holiday status, sync conflicts, and reconciliation alerts.
      </p>
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
