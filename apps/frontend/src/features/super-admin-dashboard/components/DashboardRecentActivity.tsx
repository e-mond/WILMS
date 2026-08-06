import type { DashboardAlert } from '@/types/dashboard';
import Link from 'next/link';
import { cn } from '@/utils/cn';
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';

export interface DashboardRecentActivityProps {
  alerts: DashboardAlert[];
  limit?: number;
}

const SEVERITY_CLASS: Record<DashboardAlert['severity'], string> = {
  danger: 'border-danger/30 bg-danger/5 text-danger',
  warning: 'border-status-at-risk/30 bg-status-at-risk-light text-status-at-risk',
  info: 'border-status-info/30 bg-status-info-light text-status-info',
};

const SEVERITY_ICON = {
  danger: ShieldAlert,
  warning: AlertTriangle,
  info: Info,
} as const;

export function DashboardRecentActivity({ alerts, limit = 8 }: DashboardRecentActivityProps) {
  const items = alerts.slice(0, limit);

  if (items.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-card/60 px-wilms-4 py-wilms-6 text-center">
        <p className="text-body text-text-muted">
          Recent operational activity will appear here as collections, approvals, and alerts occur.
        </p>
      </div>
    );
  }

  return (
    <ol className="timeline-rail space-y-wilms-3 pl-wilms-6" aria-label="Recent activity timeline">
      {items.map((alert) => {
        const Icon = SEVERITY_ICON[alert.severity];
        const content = (
          <>
            <div className="flex items-start gap-wilms-2">
              <span
                className={cn(
                  'mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-card',
                  SEVERITY_CLASS[alert.severity],
                )}
                aria-hidden="true"
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-body font-semibold text-text-primary">{alert.message}</p>
                <p className="mt-wilms-1 text-small text-text-muted">
                  {new Intl.DateTimeFormat('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(new Date(alert.createdAt))}
                </p>
              </div>
            </div>
          </>
        );

        return (
          <li key={alert.id} className="relative">
            {alert.href ? (
              <Link
                href={alert.href}
                className={cn(
                  'block rounded-[var(--radius-card)] border px-wilms-3 py-wilms-2 motion-card-lift',
                  SEVERITY_CLASS[alert.severity],
                )}
              >
                {content}
              </Link>
            ) : (
              <div
                className={cn(
                  'rounded-[var(--radius-card)] border px-wilms-3 py-wilms-2',
                  SEVERITY_CLASS[alert.severity],
                )}
              >
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
