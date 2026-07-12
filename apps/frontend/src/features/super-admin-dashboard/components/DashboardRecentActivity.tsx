import type { DashboardAlert } from '@/types/dashboard';
import Link from 'next/link';
import { cn } from '@/utils/cn';

export interface DashboardRecentActivityProps {
  alerts: DashboardAlert[];
  limit?: number;
}

const SEVERITY_CLASS: Record<DashboardAlert['severity'], string> = {
  danger: 'border-danger/30 bg-danger/5 text-danger',
  warning: 'border-status-at-risk/30 bg-status-at-risk-light text-status-at-risk',
  info: 'border-status-info/30 bg-status-info-light text-status-info',
};

export function DashboardRecentActivity({ alerts, limit = 5 }: DashboardRecentActivityProps) {
  const items = alerts.slice(0, limit);

  if (items.length === 0) {
    return (
      <p className="text-body text-text-muted">
        Recent operational activity will appear here as collections, approvals, and alerts occur.
      </p>
    );
  }

  return (
    <ul className="space-y-wilms-2" aria-label="Recent activity">
      {items.map((alert) => {
        const content = (
          <>
            <p className="text-body font-semibold">{alert.message}</p>
            <p className="mt-wilms-1 text-small text-text-muted">
              {new Intl.DateTimeFormat('en-GB', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              }).format(new Date(alert.createdAt))}
            </p>
          </>
        );

        return (
          <li key={alert.id}>
            {alert.href ? (
              <Link
                href={alert.href}
                className={cn(
                  'block rounded-sm border px-wilms-3 py-wilms-2 transition-colors hover:brightness-95',
                  SEVERITY_CLASS[alert.severity],
                )}
              >
                {content}
              </Link>
            ) : (
              <div className={cn('rounded-sm border px-wilms-3 py-wilms-2', SEVERITY_CLASS[alert.severity])}>
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
