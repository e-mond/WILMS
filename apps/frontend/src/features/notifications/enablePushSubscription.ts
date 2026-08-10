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

export type EnablePushResult =
  | { ok: true; alreadySubscribed?: boolean }
  | { ok: false; reason: 'unsupported' | 'vapid_missing' | 'permission_denied' | 'error'; message: string };

/**
 * Subscribe the current browser for Web Push.
 * When `requestPermission` is false, only completes if Notification.permission is already granted
 * (safe for automatic bootstrap without a user gesture).
 */
export async function enablePushSubscription(options?: {
  requestPermission?: boolean;
}): Promise<EnablePushResult> {
  const requestPermission = options?.requestPermission ?? true;

  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: false, reason: 'unsupported', message: 'Push is not supported in this browser.' };
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      await notificationPreferencesService.subscribePush(existing.toJSON());
      return { ok: true, alreadySubscribed: true };
    }

    const { publicKey } = await notificationPreferencesService.getVapidPublicKey();
    if (!publicKey) {
      return {
        ok: false,
        reason: 'vapid_missing',
        message:
          'Push delivery is not configured on this environment (VAPID keys missing). In-app alerts still work.',
      };
    }

    let permission = Notification.permission;
    if (permission !== 'granted') {
      if (!requestPermission) {
        return {
          ok: false,
          reason: 'permission_denied',
          message: 'Notification permission is not granted yet.',
        };
      }
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      return {
        ok: false,
        reason: 'permission_denied',
        message: 'Notification permission was not granted.',
      };
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    await notificationPreferencesService.subscribePush(subscription.toJSON());
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: 'error',
      message: error instanceof Error ? error.message : 'Unable to enable push notifications.',
    };
  }
}
