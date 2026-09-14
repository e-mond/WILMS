import { getAppVersionLabel } from '@/lib/app-version';

function formatSyncTime(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  }).format(date);
}

export function OfficeShellFooter() {
  const now = new Date();
  const versionLabel = getAppVersionLabel();

  return (
    <footer className="border-t border-border/80 bg-card px-6 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-text-muted">
        <p>
          WILMS — Women&apos;s Interest-Free Loan Management System — Ghana
          {versionLabel ? ` · ${versionLabel}` : null}
        </p>
        <p className="inline-flex items-center gap-2 font-medium">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-xs" aria-hidden="true" />
          Last sync: {formatSyncTime(now)} — All systems operational
        </p>
      </div>
    </footer>
  );
}
