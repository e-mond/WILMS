'use client';

import Link from 'next/link';
import { DashboardAlertIcon } from '@/components/icons/DashboardAlertIcon';
import type { DashboardAlert } from '@/types/dashboard';
import { formatAlertClock } from '@/utils/format-alert-clock';
import { TrendingUp, ArrowUpRight } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface DashboardAlertsAsideProps {
  alerts: readonly DashboardAlert[];
}

const BAR_HEIGHTS = [35, 45, 30, 60, 55, 40, 75, 65, 80, 70, 90, 100];

export function DashboardAlertsAside({ alerts }: DashboardAlertsAsideProps) {
  const criticalCount = alerts.filter((alert) => alert.severity === 'danger').length;
  const preview = alerts.slice(0, 5);

  return (
    <div className="flex flex-col space-y-6">
      {/* ─── Recent Activity / Alerts Card ─── */}
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
          <p className="text-xs text-text-muted py-2">No alerts in the current window.</p>
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

      {/* ─── Portfolio Insights Card (Mini Bar Chart) ─── */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-brand-primary dark:bg-indigo-950/40">
              <TrendingUp className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-xs font-bold text-text-primary">Weekly Velocity</h3>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <span>+18.4%</span>
            <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>

        <p className="mt-2 text-[11px] text-text-muted">
          Repayment momentum is strong across 14 field collection clusters.
        </p>

        {/* Mini Bar Chart visualization matching inspo */}
        <div className="mt-4 flex h-20 items-end gap-1.5 pt-2">
          {BAR_HEIGHTS.map((height, index) => (
            <div
              key={index}
              className="group relative flex-1 flex flex-col justify-end h-full"
            >
              <div
                style={{ height: `${height}%` }}
                className={cn(
                  'w-full rounded-t-sm transition-all group-hover:opacity-80',
                  index === BAR_HEIGHTS.length - 1
                    ? 'bg-gradient-to-t from-brand-primary to-indigo-500'
                    : 'bg-indigo-200/80 dark:bg-indigo-900/60',
                )}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-text-muted">
          <span>Week 1</span>
          <span>Week 2</span>
          <span>Week 3</span>
          <span className="font-semibold text-brand-primary">Current</span>
        </div>
      </div>

      {/* ─── Quote / Mission Card (matching bottom inspo card) ─── */}
      <div className="rounded-2xl border border-indigo-950 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-4 text-white shadow-xs">
        <p className="text-xs italic leading-relaxed text-indigo-100">
          &ldquo;Empowering women through interest-free community capital.&rdquo;
        </p>
        <p className="mt-2 text-[11px] font-semibold text-indigo-300">
          — WILMS Ghana Mission
        </p>
      </div>
    </div>
  );
}
