'use client';

import { useEffect } from 'react';
import { isOfflineModeEnabled } from '@/config/offline-mode';
import { PWA_SW_PATH, PWA_SW_SET_OFFLINE_MODE } from '@/constants/pwa';
import { usePwaUpdateStore } from '@/state/pwaUpdateStore';
import { logger } from '@/utils/logger';

function trackWaitingWorker(worker: ServiceWorker) {
  usePwaUpdateStore.getState().setUpdateAvailable(worker);
}

function postOfflineModeToWorker(worker: ServiceWorker | null | undefined) {
  if (!worker) {
    return;
  }
  worker.postMessage({
    type: PWA_SW_SET_OFFLINE_MODE,
    enabled: isOfflineModeEnabled(),
  });
}

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    let cancelled = false;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register(PWA_SW_PATH, {
          scope: '/',
        });

        if (!cancelled) {
          logger.info('Service worker registered', { scope: registration.scope });
        }

        postOfflineModeToWorker(registration.active);
        postOfflineModeToWorker(registration.waiting);
        postOfflineModeToWorker(registration.installing);
        if (navigator.serviceWorker.controller) {
          postOfflineModeToWorker(navigator.serviceWorker.controller);
        }

        if (registration.waiting) {
          trackWaitingWorker(registration.waiting);
        }

        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) {
            return;
          }

          installing.addEventListener('statechange', () => {
            if (installing.state === 'activated' || installing.state === 'installed') {
              postOfflineModeToWorker(installing);
            }
            if (
              installing.state === 'installed' &&
              navigator.serviceWorker.controller &&
              !cancelled
            ) {
              trackWaitingWorker(installing);
            }
          });
        });
      } catch (error) {
        logger.warn('Service worker registration failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    void register();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
