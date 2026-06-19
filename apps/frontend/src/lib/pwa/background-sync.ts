import { PWA_PAYMENT_SYNC_TAG } from '@/constants/pwa';

interface SyncManager {
  register: (tag: string) => Promise<void>;
}

interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  sync?: SyncManager;
}

export async function requestPaymentBackgroundSync(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = (await navigator.serviceWorker.ready) as ServiceWorkerRegistrationWithSync;

    if (!registration.sync) {
      return false;
    }

    await registration.sync.register(PWA_PAYMENT_SYNC_TAG);
    return true;
  } catch {
    return false;
  }
}
