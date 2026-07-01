'use client';

import { useEffect } from 'react';
import { PWA_SW_PATH } from '@/constants/pwa';
import { logger } from '@/utils/logger';

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    let cancelled = false;
    let reloaded = false;

    const onControllerChange = () => {
      if (cancelled || reloaded) {
        return;
      }
      reloaded = true;
      window.location.reload();
    };

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register(PWA_SW_PATH, {
          scope: '/',
        });

        if (!cancelled) {
          logger.info('Service worker registered', { scope: registration.scope });
        }

        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) {
            return;
          }
          installing.addEventListener('statechange', () => {
            if (
              installing.state === 'installed' &&
              navigator.serviceWorker.controller &&
              !cancelled
            ) {
              installing.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });

        navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
      } catch (error) {
        logger.warn('Service worker registration failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    void register();

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  return null;
}
