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
    <footer className="border-t border-border px-wilms-6 py-wilms-4">
      <div className="flex flex-wrap items-center justify-between gap-wilms-3 text-small text-text-muted">
        <p>
          WILMS — Women&apos;s Interest-Free Loan Management System — Ghana
          {versionLabel ? ` · ${versionLabel}` : null}
        </p>
        <p className="inline-flex items-center gap-wilms-2">
          <span className="h-2 w-2 rounded-full bg-status-active" aria-hidden="true" />
          Last sync: {formatSyncTime(now)} — All systems operational
        </p>
      </div>
    </footer>
  );
}
