'use client';

import { useCallback, useEffect, useRef } from 'react';
import { isAutoSyncEnabled, resolveOfflineSyncIntervalMs, shouldPauseBackgroundSync } from '@/lib/device/sync-policy';
import { useBatteryStatus } from '@/hooks/useBatteryStatus';
import { logger } from '@/utils/logger';
import { useOfflineQueueStore } from '@/state/offlineQueueStore';
import { OFFLINE_QUEUE_ITEM_STATUS, OFFLINE_QUEUE_ITEM_TYPE } from '@/types/offline-queue';
import type {
  OfflineExpenseQueueItem,
  OfflineExpenseSyncHandler,
  OfflinePaymentSyncHandler,
  OfflineQueueItem,
} from '@/types/offline-queue';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';

interface UseOfflineQueueSyncOptions {
  paymentSyncHandler?: OfflinePaymentSyncHandler | null;
  expenseSyncHandler?: OfflineExpenseSyncHandler | null;
}

function getDrainableItems(items: OfflineQueueItem[]): OfflineQueueItem[] {
  return items
    .filter(
      (item) =>
        item.status === OFFLINE_QUEUE_ITEM_STATUS.PENDING ||
        item.status === OFFLINE_QUEUE_ITEM_STATUS.FAILED,
    )
    .sort((left, right) => left.createdAt - right.createdAt);
}

export function useOfflineQueueSync({
  paymentSyncHandler = null,
  expenseSyncHandler = null,
}: UseOfflineQueueSyncOptions) {
  const { isOnline } = useOfflineStatus();
  const battery = useBatteryStatus();
  const isSyncingRef = useRef(false);

  const items = useOfflineQueueStore((state) => state.items);
  const syncState = useOfflineQueueStore((state) => state.syncState);
  const markSyncing = useOfflineQueueStore((state) => state.markSyncing);
  const markSynced = useOfflineQueueStore((state) => state.markSynced);
  const markQueuedForReview = useOfflineQueueStore((state) => state.markQueuedForReview);
  const markFailed = useOfflineQueueStore((state) => state.markFailed);
  const removeSyncedItems = useOfflineQueueStore((state) => state.removeSyncedItems);
  const setSyncState = useOfflineQueueStore((state) => state.setSyncState);

  const runSync = useCallback(async () => {
    if (
      !isOnline ||
      isSyncingRef.current ||
      !isAutoSyncEnabled() ||
      shouldPauseBackgroundSync(battery.savingMode, battery.savingMode) ||
      (!paymentSyncHandler && !expenseSyncHandler)
    ) {
      return;
    }

    const drainable = getDrainableItems(useOfflineQueueStore.getState().items).filter(
      (item) =>
        (item.type === OFFLINE_QUEUE_ITEM_TYPE.RECORD_PAYMENT && paymentSyncHandler) ||
        (item.type === OFFLINE_QUEUE_ITEM_TYPE.RECORD_EXPENSE && expenseSyncHandler),
    );

    if (drainable.length === 0) {
      return;
    }

    isSyncingRef.current = true;
    setSyncState('syncing');

    try {
      for (const item of drainable) {
        markSyncing(item.id);

        try {
          if (item.type === OFFLINE_QUEUE_ITEM_TYPE.RECORD_PAYMENT) {
            const outcome = await paymentSyncHandler!(item);

            if (outcome === 'queued_for_review') {
              markQueuedForReview(item.id);
            } else {
              markSynced(item.id);
            }
          } else {
            await expenseSyncHandler!(item as OfflineExpenseQueueItem);
            markSynced(item.id);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Sync failed';
          markFailed(item.id, message);
          logger.warn('Offline queue item sync failed', {
            itemId: item.id,
            error: message,
          });
        }
      }

      removeSyncedItems();
    } catch (error) {
      logger.error('Offline queue drain aborted', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      isSyncingRef.current = false;
      setSyncState('idle');
    }
  }, [
    isOnline,
    markFailed,
    markQueuedForReview,
    markSynced,
    markSyncing,
    removeSyncedItems,
    setSyncState,
    paymentSyncHandler,
    expenseSyncHandler,
    battery.savingMode,
  ]);

  useEffect(() => {
    if (isOnline && (paymentSyncHandler || expenseSyncHandler)) {
      void runSync();
    }
  }, [isOnline, items.length, runSync, paymentSyncHandler, expenseSyncHandler]);

  useEffect(() => {
    if (!isOnline || (!paymentSyncHandler && !expenseSyncHandler)) {
      return;
    }

    const hasPending = items.some(
      (item) =>
        item.status === OFFLINE_QUEUE_ITEM_STATUS.PENDING ||
        item.status === OFFLINE_QUEUE_ITEM_STATUS.FAILED,
    );

    if (!hasPending) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void runSync();
    }, resolveOfflineSyncIntervalMs());

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isOnline, items, runSync, paymentSyncHandler, expenseSyncHandler]);

  return {
    syncState,
    runSync,
  };
}
