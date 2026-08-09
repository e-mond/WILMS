'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useOfflineQueueStore } from '@/state/offlineQueueStore';
import { OFFLINE_QUEUE_ITEM_STATUS } from '@/types/offline-queue';

interface OfflineSyncStatusPanelProps {
  pendingPayments: number;
  pendingExpenses: number;
  pendingHolidays: number;
  reviewPayments: number;
  isSyncing: boolean;
  onRetrySync: () => void;
}

export function OfflineSyncStatusPanel({
  pendingPayments,
  pendingExpenses,
  pendingHolidays,
  reviewPayments,
  isSyncing,
  onRetrySync,
}: OfflineSyncStatusPanelProps) {
  const items = useOfflineQueueStore((state) => state.items);
  const failedCount = items.filter((item) => item.status === OFFLINE_QUEUE_ITEM_STATUS.FAILED).length;
  const pending = pendingPayments + pendingExpenses + pendingHolidays;
  const totalTracked = Math.max(pending + failedCount, pending, 1);

  if (pending === 0 && reviewPayments === 0 && failedCount === 0) {
    return null;
  }

  const completedEstimate = Math.max(totalTracked - pending, 0);
  const progress = isSyncing
    ? Math.min(95, Math.max(12, Math.round((completedEstimate / totalTracked) * 100)))
    : pending === 0
      ? 100
      : Math.max(8, Math.round((completedEstimate / totalTracked) * 100));

  return (
    <aside className="border-b border-border bg-surface/95 px-wilms-4 py-wilms-2 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col gap-wilms-2">
        <div className="flex flex-wrap items-center justify-between gap-wilms-2">
          <p className="text-small text-text-secondary">
            Offline queue: {pending} pending
            {failedCount > 0 ? ` · ${failedCount} failed` : ''}
            {reviewPayments > 0 ? ` · ${reviewPayments} awaiting review` : ''}
            {isSyncing ? ' · syncing' : ''}
          </p>
          <div className="flex flex-wrap items-center gap-wilms-2">
            <Button size="sm" variant="secondary" disabled={isSyncing || pending === 0} onClick={onRetrySync}>
              {isSyncing ? 'Syncing…' : 'Retry sync'}
            </Button>
            <Link
              href="/approver/sync-conflicts"
              className="text-small font-semibold text-brand-primary underline-offset-2 hover:underline"
            >
              Review conflicts
            </Link>
          </div>
        </div>
        {isSyncing || pending > 0 || failedCount > 0 ? (
          <div
            className="h-1.5 overflow-hidden rounded-full bg-border/70"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label="Offline sync progress"
          >
            <div
              className="h-full rounded-full bg-brand-primary transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : null}
      </div>
    </aside>
  );
}
