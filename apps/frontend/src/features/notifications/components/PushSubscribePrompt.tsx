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

  useEffect(() => {
    setSupported('serviceWorker' in navigator && 'PushManager' in window);
  }, []);

  async function enablePush() {
    if (!supported) return;
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const { publicKey } = await notificationPreferencesService.getVapidPublicKey();
      if (!publicKey) return;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await notificationPreferencesService.subscribePush(subscription.toJSON());
      setSubscribed(true);
    } catch (error) {
      console.error('[push] subscribe failed', error);
    } finally {
      setLoading(false);
    }
  }

  if (!supported || subscribed) {
    return null;
  }

  return (
    <div className="rounded-md border border-border bg-background p-wilms-4">
      <p className="text-body text-text-primary">Enable browser push notifications for real-time alerts.</p>
      <Button type="button" size="sm" className="mt-wilms-3" disabled={loading} onClick={() => void enablePush()}>
        {loading ? 'Enabling…' : 'Enable push notifications'}
      </Button>
    </div>
  );
}
