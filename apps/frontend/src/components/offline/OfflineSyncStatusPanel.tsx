'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';

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
  const pending = pendingPayments + pendingExpenses + pendingHolidays;
  if (pending === 0 && reviewPayments === 0) {
    return null;
  }

  return (
    <aside className="border-b border-border bg-surface px-wilms-4 py-wilms-2">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-wilms-2">
        <p className="text-small text-text-secondary">
          Offline queue: {pending} pending
          {reviewPayments > 0 ? ` · ${reviewPayments} awaiting review` : ''}
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
    </aside>
  );
}
