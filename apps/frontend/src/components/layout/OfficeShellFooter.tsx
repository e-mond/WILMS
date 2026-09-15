'use client';

import { useEffect, useState } from 'react';
import { useIsFetching } from '@tanstack/react-query';

function formatSyncTime(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  }).format(date);
}

export function OfficeShellFooter() {
  const activeFetches = useIsFetching();
  const isSyncing = activeFetches > 0;
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!isSyncing) {
      setLastSyncAt(new Date());
    }
  }, [isSyncing]);

  return (
    <footer className="border-t border-border/80 bg-card px-6 py-3">
      <div className="flex items-center justify-center">
        <p
          className="inline-flex items-center gap-2 text-xs font-medium text-text-muted"
          role="status"
          aria-live="polite"
        >
          {isSyncing ? (
            <>
              <span
                className="h-2.5 w-2.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
                aria-hidden="true"
              />
              <span>Last sync: Syncing…</span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
              <span>
                Last sync: {lastSyncAt ? formatSyncTime(lastSyncAt) : '—'} — All systems operational
              </span>
            </>
          )}
        </p>
      </div>
    </footer>
  );
}
