'use client';

import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/useToast';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import {
  selectPendingQueueCount,
  selectQueuedForReviewCount,
  useOfflineQueueStore,
} from '@/state/offlineQueueStore';

export function useOfflineQueueToasts() {
  const toast = useToast();
  const { isOffline } = useOfflineStatus();
  const syncState = useOfflineQueueStore((state) => state.syncState);
  const items = useOfflineQueueStore((state) => state.items);

  const wasOfflineRef = useRef(isOffline);
  const previousSyncStateRef = useRef(syncState);
  const offlineToastIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!wasOfflineRef.current && isOffline) {
      offlineToastIdRef.current = toast.offline('You are offline', {
        message: 'Payments will be saved locally and synced when connection returns.',
      });
    }

    if (wasOfflineRef.current && !isOffline) {
      if (offlineToastIdRef.current) {
        toast.dismiss(offlineToastIdRef.current);
        offlineToastIdRef.current = null;
      }
      toast.info('Back online', { message: 'Connection restored.' });
    }

    wasOfflineRef.current = isOffline;
  }, [isOffline, toast]);

  useEffect(() => {
    const wasSyncing = previousSyncStateRef.current === 'syncing';
    const isIdle = syncState === 'idle';

    if (wasSyncing && isIdle) {
      const pendingCount = selectPendingQueueCount(items);
      const reviewCount = selectQueuedForReviewCount(items);

      if (pendingCount === 0 && reviewCount > 0) {
        toast.info('Submitted for review', {
          message: `${reviewCount} payment${reviewCount === 1 ? '' : 's'} sent to approver queue.`,
        });
      } else if (pendingCount === 0 && reviewCount === 0) {
        toast.sync('Sync complete', { message: 'All offline payments uploaded.' });
      } else {
        toast.warning('Sync incomplete', {
          message: `${pendingCount} payment${pendingCount === 1 ? '' : 's'} still pending.`,
        });
      }
    }

    if (!wasSyncing && syncState === 'syncing') {
      const pendingCount = selectPendingQueueCount(items);
      if (pendingCount > 0) {
        toast.sync('Syncing payments', {
          message: `Uploading ${pendingCount} saved payment${pendingCount === 1 ? '' : 's'}...`,
          durationMs: 3_000,
        });
      }
    }

    previousSyncStateRef.current = syncState;
  }, [items, syncState, toast]);
}
