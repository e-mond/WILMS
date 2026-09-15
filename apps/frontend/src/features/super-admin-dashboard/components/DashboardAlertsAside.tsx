'use client';

import Link from 'next/link';
import { ArrowUpRight, TrendingDown, TrendingUp } from 'lucide-react';
import { DashboardAlertIcon } from '@/components/icons/DashboardAlertIcon';
import { Skeleton } from '@/components/feedback/Skeleton';
import { CurrencyAmount } from '@/components/data-display';
import type { DashboardAlert } from '@/types/dashboard';
import { formatAlertClock } from '@/utils/format-alert-clock';
import { useWeeklyCollectionVelocity } from '@/features/super-admin-dashboard/hooks/useWeeklyCollectionVelocity';
import { cn } from '@/utils/cn';

export interface DashboardAlertsAsideProps {
  alerts: readonly DashboardAlert[];
}

function WeeklyVelocityCard() {
  const { data, isLoading, isError, refetch } = useWeeklyCollectionVelocity();
  const maxCollected = Math.max(...(data?.days.map((day) => day.collectedPesewas) ?? [0]), 1);
  const trend = data?.trendPercent ?? 0;
  const trendPositive = trend >= 0;

  return (
    <div
      className="rounded-xl border border-border/80 bg-card p-4"
      data-testid="dashboard-weekly-velocity"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-primary-light text-brand-primary">
              {trendPositive ? (
                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </span>
            <h3 className="text-small font-semibold text-text-primary">Weekly velocity</h3>
          </div>
          <p className="mt-1 text-[11px] text-text-muted">
            Daily collections over the last 7 days.
          </p>
        </div>
        {data ? (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
              trendPositive
                ? 'bg-status-active-light text-status-active'
                : 'bg-danger/10 text-danger',
            )}
          >
            <span>
              {trendPositive ? '+' : ''}
              {trend}%
            </span>
            <ArrowUpRight
              className={cn('h-3 w-3', !trendPositive && 'rotate-90')}
              aria-hidden="true"
            />
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-2" aria-busy="true">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      ) : null}

      {isError ? (
        <div className="mt-4 rounded-lg border border-danger/30 bg-danger/5 px-3 py-3" role="alert">
          <p className="text-small font-medium text-text-primary">Unable to load velocity</p>
          <button
            type="button"
            className="mt-2 text-small font-semibold text-brand-primary hover:underline"
            onClick={() => void refetch()}
          >
            Retry
          </button>
        </div>
      ) : null}

      {data && !isLoading && !isError ? (
        <>
          <div className="mt-4 flex h-20 items-end gap-1.5" role="img" aria-label="Weekly collection bars">
            {data.days.map((day, index) => {
              const heightPercent = Math.max(6, Math.round((day.collectedPesewas / maxCollected) * 100));
              const isLatest = index === data.days.length - 1;
              return (
                <div key={day.date} className="group relative flex h-full flex-1 flex-col justify-end">
                  <div
                    className={cn(
                      'w-full rounded-t-sm transition-opacity',
                      isLatest ? 'bg-brand-primary' : 'bg-brand-primary/25 dark:bg-brand-primary/35',
                    )}
                    style={{ height: `${heightPercent}%` }}
                    title={`${day.label}: ${(day.collectedPesewas / 100).toLocaleString('en-GH', {
                      style: 'currency',
                      currency: 'GHS',
                      maximumFractionDigits: 0,
                    })}`}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-text-muted">
            <span>{data.days[0]?.label}</span>
            <span className="font-semibold text-brand-primary">
              {data.days[data.days.length - 1]?.label}
            </span>
          </div>
          <p className="mt-3 text-[11px] text-text-muted">
            Week total{' '}
            <span className="font-semibold text-text-primary">
              <CurrencyAmount value={data.weekTotalPesewas} className="text-[11px]" />
            </span>
          </p>
        </>
      ) : null}
    </div>
  );
}

export function DashboardAlertsAside({ alerts }: DashboardAlertsAsideProps) {
  const criticalCount = alerts.filter((alert) => alert.severity === 'danger').length;
  const preview = alerts.slice(0, 5);

  return (
    <div className="flex flex-col space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-brand-primary" aria-hidden="true" />
            <h2 className="text-base font-bold text-text-primary">Recent Activity</h2>
          </div>
          <Link
            href="/reports/audit-log"
            className="inline-flex items-center gap-0.5 text-xs font-semibold text-brand-primary hover:underline"
          >
            <span>View all</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {criticalCount > 0 ? (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300">
            <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse" aria-hidden="true" />
            <span>{criticalCount} critical operational alerts</span>
          </div>
        ) : null}

        {preview.length === 0 ? (
          <p className="py-2 text-xs text-text-muted">No alerts in the current window.</p>
        ) : (
          <ul className="space-y-2.5">
            {preview.map((alert) => {
              const content = (
                <div className="flex items-start gap-3 rounded-xl p-2 transition-colors hover:bg-slate-100/70 dark:hover:bg-white/5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                    <DashboardAlertIcon icon={alert.icon} className="mt-0 h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-xs font-medium text-text-primary">
                      {alert.message}
                    </p>
                    <time
                      dateTime={alert.createdAt}
                      className="mt-0.5 block text-[11px] text-text-muted"
                    >
                      {formatAlertClock(alert.createdAt)}
                    </time>
                  </div>
                </div>
              );

              return (
                <li key={alert.id}>
                  {alert.href ? (
                    <Link href={alert.href} className="block">
                      {content}
                    </Link>
                  ) : (
                    content
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <WeeklyVelocityCard />
    </div>
  );
}
