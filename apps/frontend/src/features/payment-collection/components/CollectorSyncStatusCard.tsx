'use client';

import { useEffect, useState } from 'react';
import { KpiCard } from '@/components/data-display';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { listPendingUploads } from '@/lib/offline-queue/upload-queue';
import {
  selectPendingExpenseCount,
  selectPendingPaymentCount,
  selectQueuedForReviewPaymentCount,
  useOfflineQueueStore,
} from '@/state/offlineQueueStore';

export function CollectorSyncStatusCard() {
  const { isOffline } = useOfflineStatus();
  const syncState = useOfflineQueueStore((state) => state.syncState);
  const items = useOfflineQueueStore((state) => state.items);
  const [pendingUploadCount, setPendingUploadCount] = useState(0);

  const pendingPayments = selectPendingPaymentCount(items);
  const pendingExpenses = selectPendingExpenseCount(items);
  const queuedItems = pendingPayments + pendingExpenses;
  const reviewPayments = selectQueuedForReviewPaymentCount(items);

  useEffect(() => {
    let cancelled = false;

    async function refreshUploadCount() {
      const uploads = await listPendingUploads();
      if (!cancelled) {
        setPendingUploadCount(uploads.length);
      }
    }

    void refreshUploadCount();
    const intervalId = window.setInterval(() => void refreshUploadCount(), 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [syncState, isOffline]);

  const connectionLabel = isOffline ? 'Offline' : 'Online';
  const connectionClass = isOffline ? 'text-danger' : 'text-status-active';
  const syncLabel =
    syncState === 'syncing'
      ? 'Syncing'
      : queuedItems > 0
        ? 'Pending'
        : reviewPayments > 0
          ? 'Awaiting review'
          : 'Up to date';

  return (
    <div className="grid gap-wilms-3 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard variant="executive" label="Connection" value={connectionLabel} valueClassName={connectionClass} />
      <KpiCard
        variant="executive"
        label="Sync status"
        value={syncLabel}
        valueClassName={queuedItems > 0 ? 'text-warning' : undefined}
      />
      <KpiCard
        variant="executive"
        label="Queued items"
        value={queuedItems}
        valueClassName={queuedItems > 0 ? 'text-warning' : undefined}
      />
      <KpiCard
        variant="executive"
        label="Pending uploads"
        value={pendingUploadCount}
        valueClassName={pendingUploadCount > 0 ? 'text-warning' : undefined}
      />
    </div>
  );
}
