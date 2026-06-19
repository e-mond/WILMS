'use client';

import Link from 'next/link';
import { DashboardAlertIcon } from '@/components/icons/DashboardAlertIcon';
import type { DashboardAlert } from '@/types/dashboard';
import { formatAlertClock } from '@/utils/format-alert-clock';

export interface DashboardAlertsAsideProps {
  alerts: readonly DashboardAlert[];
}

export function DashboardAlertsAside({ alerts }: DashboardAlertsAsideProps) {
  const criticalCount = alerts.filter((alert) => alert.severity === 'danger').length;

  return (
    <div className="flex h-full flex-col space-y-wilms-4">
      <div className="flex items-center justify-between gap-wilms-3">
        <h2 className="text-heading-2 font-semibold text-text-primary">Recent Alerts</h2>
        {criticalCount > 0 ? (
          <span className="inline-flex items-center gap-wilms-1 rounded-sm border border-danger bg-danger-light px-wilms-2 py-wilms-1 text-small font-semibold text-danger">
            <span className="h-1.5 w-1.5 rounded-full bg-danger" aria-hidden="true" />
            {criticalCount} critical
          </span>
        ) : null}
      </div>

      <ul className="min-h-0 flex-1 space-y-wilms-3 overflow-y-auto">
        {alerts.map((alert) => {
          const content = (
            <>
              <DashboardAlertIcon icon={alert.icon} />
              <p className="min-w-0 flex-1 text-body text-text-primary">{alert.message}</p>
              <time
                dateTime={alert.createdAt}
                className="shrink-0 text-small font-semibold text-text-muted"
              >
                {formatAlertClock(alert.createdAt)}
              </time>
            </>
          );

          return (
            <li
              key={alert.id}
              className="border-b border-border pb-wilms-3 last:border-b-0 last:pb-0"
            >
              {alert.href ? (
                <Link
                  href={alert.href}
                  className="flex min-h-[44px] items-start gap-wilms-3 rounded-sm p-wilms-1 hover:bg-accent/40 hover:underline"
                >
                  {content}
                </Link>
              ) : (
                <div className="flex min-h-[44px] items-start gap-wilms-3 p-wilms-1">
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <Link
        href="/reports/audit-log"
        className="text-small font-semibold text-brand-primary hover:underline"
      >
        View All Alerts
      </Link>
    </div>
  );
}
