'use client';

import { useEffect } from 'react';
import { attemptChunkRecovery, isChunkLoadError } from '@/lib/chunk-recovery';

/**
 * Recovers automatically from post-deploy stale bundle errors during client navigation.
 */
export function ChunkRecoveryHandler() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      if (isChunkLoadError(event.error ?? event.message)) {
        attemptChunkRecovery();
      }
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isChunkLoadError(event.reason)) {
        event.preventDefault();
        attemptChunkRecovery();
      }
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return null;
}
