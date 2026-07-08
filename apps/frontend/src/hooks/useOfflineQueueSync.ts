'use client';

import { useCallback, useEffect, useRef } from 'react';
import { drainOfflineQueue } from '@/lib/offline-queue/sync';
import { isAutoSyncEnabled, resolveOfflineSyncIntervalMs, shouldPauseBackgroundSync } from '@/lib/device/sync-policy';
import { useBatteryStatus } from '@/hooks/useBatteryStatus';
import { logger } from '@/utils/logger';
import { useOfflineQueueStore } from '@/state/offlineQueueStore';
import { OFFLINE_QUEUE_ITEM_STATUS } from '@/types/offline-queue';
import type { OfflinePaymentSyncHandler } from '@/types/offline-queue';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';

interface UseOfflineQueueSyncOptions {
  syncHandler: OfflinePaymentSyncHandler | null;
}

export function useOfflineQueueSync({ syncHandler }: UseOfflineQueueSyncOptions) {
  const { isOnline } = useOfflineStatus();
  const battery = useBatteryStatus();
  const isSyncingRef = useRef(false);

  const items = useOfflineQueueStore((state) => state.items);
  const syncState = useOfflineQueueStore((state) => state.syncState);
  const markSyncing = useOfflineQueueStore((state) => state.markSyncing);
  const markSynced = useOfflineQueueStore((state) => state.markSynced);
  const markFailed = useOfflineQueueStore((state) => state.markFailed);
  const removeSyncedItems = useOfflineQueueStore((state) => state.removeSyncedItems);
  const setSyncState = useOfflineQueueStore((state) => state.setSyncState);

  const runSync = useCallback(async () => {
    if (
      !syncHandler ||
      !isOnline ||
      isSyncingRef.current ||
      !isAutoSyncEnabled() ||
      shouldPauseBackgroundSync(battery.savingMode, battery.savingMode)
    ) {
      return;
    }

    const currentItems = useOfflineQueueStore.getState().items;
    const hasDrainable = currentItems.some(
      (item) =>
        item.status === OFFLINE_QUEUE_ITEM_STATUS.PENDING ||
        item.status === OFFLINE_QUEUE_ITEM_STATUS.FAILED,
    );

    if (!hasDrainable) {
      return;
    }

    isSyncingRef.current = true;
    setSyncState('syncing');

    try {
      const wrappedHandler: OfflinePaymentSyncHandler = async (item) => {
        markSyncing(item.id);
        await syncHandler(item);
        markSynced(item.id);
      };

      const result = await drainOfflineQueue(currentItems, wrappedHandler);

      for (const failure of result.failed) {
        markFailed(failure.id, failure.error);
        logger.warn('Offline queue item sync failed', {
          itemId: failure.id,
          error: failure.error,
        });
      }

      removeSyncedItems();

      if (result.synced.length > 0) {
        logger.info('Offline queue drained', { syncedCount: result.synced.length });
      }
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
    markSynced,
    markSyncing,
    removeSyncedItems,
    setSyncState,
    syncHandler,
    battery.savingMode,
  ]);

  useEffect(() => {
    if (isOnline && syncHandler) {
      void runSync();
    }
  }, [isOnline, items.length, runSync, syncHandler]);

  useEffect(() => {
    if (!isOnline || !syncHandler) {
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
  }, [isOnline, items, runSync, syncHandler]);

  return {
    syncState,
    runSync,
  };
}
