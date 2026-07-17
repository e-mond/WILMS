'use client';

import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/useToast';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import {
  selectPendingExpenseCount,
  selectPendingPaymentCount,
  selectPendingQueueCount,
  selectQueuedForReviewPaymentCount,
  useOfflineQueueStore,
} from '@/state/offlineQueueStore';

function formatPendingLabel(pendingPayments: number, pendingExpenses: number): string {
  const parts: string[] = [];

  if (pendingPayments > 0) {
    parts.push(`${pendingPayments} payment${pendingPayments === 1 ? '' : 's'}`);
  }

  if (pendingExpenses > 0) {
    parts.push(`${pendingExpenses} expense${pendingExpenses === 1 ? '' : 's'}`);
  }

  return parts.join(' and ');
}

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
        message: 'Payments and expenses will be saved locally and synced when connection returns.',
      });
    }

    if (wasOfflineRef.current && !isOffline) {
      if (offlineToastIdRef.current) {
        toast.dismiss(offlineToastIdRef.current);
        offlineToastIdRef.current = null;
      }
      toast.info('Back online', {
        message: 'Connection restored.',
        dedupeKey: 'connectivity:back-online',
      });
    }

    wasOfflineRef.current = isOffline;
  }, [isOffline, toast]);

  useEffect(() => {
    const wasSyncing = previousSyncStateRef.current === 'syncing';
    const isIdle = syncState === 'idle';

    if (wasSyncing && isIdle) {
      const pendingPayments = selectPendingPaymentCount(items);
      const pendingExpenses = selectPendingExpenseCount(items);
      const pendingCount = selectPendingQueueCount(items);
      const reviewCount = selectQueuedForReviewPaymentCount(items);
      const pendingLabel = formatPendingLabel(pendingPayments, pendingExpenses);

      if (pendingCount === 0 && reviewCount > 0) {
        toast.info('Submitted for review', {
          message: `${reviewCount} payment${reviewCount === 1 ? '' : 's'} sent to approver queue.`,
        });
      } else if (pendingCount === 0 && reviewCount === 0) {
        toast.sync('Sync complete', { message: 'All offline items uploaded.' });
      } else {
        toast.warning('Sync incomplete', {
          message: `${pendingLabel} still pending.`,
        });
      }
    }

    if (!wasSyncing && syncState === 'syncing') {
      const pendingPayments = selectPendingPaymentCount(items);
      const pendingExpenses = selectPendingExpenseCount(items);
      const pendingCount = selectPendingQueueCount(items);

      if (pendingCount > 0) {
        toast.sync('Syncing saved items', {
          message: `Uploading ${formatPendingLabel(pendingPayments, pendingExpenses)}...`,
          durationMs: 3_000,
        });
      }
    }

    previousSyncStateRef.current = syncState;
  }, [items, syncState, toast]);
}
