'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { CurrencyAmount, GroupRiskCard, KpiCard } from '@/components/data-display';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import {
  DashboardKpiIcon,
  type DashboardKpiIconName,
} from '@/components/icons/DashboardKpiIcon';
import { DashboardQuickActionIcon } from '@/components/icons/DashboardQuickActionIcon';
import {
  DASHBOARD_BORROWER_TONE_CLASS,
  DASHBOARD_VALUE_TONE_CLASS,
} from '@/constants/dashboard-display';
import { DashboardAlertsAside } from '@/features/super-admin-dashboard/components/DashboardAlertsAside';
import { DashboardCollectorPerformance } from '@/features/super-admin-dashboard/components/DashboardCollectorPerformance';
import { DashboardCollectionSummary } from '@/features/super-admin-dashboard/components/DashboardCollectionSummary';
import { DashboardCycleSnapshot } from '@/features/super-admin-dashboard/components/DashboardCycleSnapshot';
import { DashboardExpenseSummary } from '@/features/super-admin-dashboard/components/DashboardExpenseSummary';
import { useDashboardSummary } from '@/features/super-admin-dashboard/hooks/useDashboardSummary';
import { useShellAsideContent } from '@/hooks/useShellAsideContent';
import { useQueryLoadingPolicy } from '@/hooks/useQueryLoadingPolicy';
import { cn } from '@/utils/cn';

const KPI_ICON_NAMES: Record<string, DashboardKpiIconName> = {
  'collected-today': 'collected',
  'collected-total': 'collected',
  outstanding: 'outstanding',
  'active-borrowers': 'pool',
};

const QUICK_ACTIONS = [
  {
    href: '/adjustments',
    label: 'Approve Adjustment',
    icon: 'approve' as const,
    className: 'border-status-active text-status-active hover:bg-status-active-light',
  },
  {
    href: '/reports/daily-collection',
    label: 'Review Variance',
    icon: 'variance' as const,
    className: 'border-brand-primary text-brand-primary hover:bg-brand-primary-light',
  },
  {
    href: '/reports/audit-log',
    label: 'View Audit Log',
    icon: 'audit' as const,
    className: 'border-status-info text-status-info hover:bg-status-info-light',
  },
];

export function SuperAdminDashboard() {
  const { data, isLoading, isError, refetch } = useDashboardSummary();
  const { showLoading, isTimedOut } = useQueryLoadingPolicy({ isLoading });
  const alertsAside = useMemo(
    () => (data ? <DashboardAlertsAside alerts={data.recentAlerts} /> : null),
    [data]
  );

  useShellAsideContent(alertsAside);

  return (
    <QueryStatePanel
      isLoading={isLoading}
      showLoading={showLoading}
      isTimedOut={isTimedOut}
      isError={isError || !data}
      errorMessage="Unable to load dashboard. Check your connection and try again."
      onRetry={() => void refetch()}
      variant="cards"
    >
      {data ? (
        <SuperAdminDashboardContent data={data} borrowerTotal={data.borrowerSegments.reduce((sum, segment) => sum + segment.count, 0)} />
      ) : null}
    </QueryStatePanel>
  );
}

function SuperAdminDashboardContent({
  data,
  borrowerTotal,
}: {
  data: NonNullable<ReturnType<typeof useDashboardSummary>['data']>;
  borrowerTotal: number;
}) {
  return (
    <div className="space-y-wilms-6">
      {/* Top Section: KPIs + Risk + Quick Actions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-2 xl:grid-cols-4">
          {data.kpis.map((kpi) => (
            <KpiCard
              key={kpi.id}
              variant="executive"
              label={kpi.label}
              icon={KPI_ICON_NAMES[kpi.id] ? <DashboardKpiIcon name={KPI_ICON_NAMES[kpi.id]} /> : null}
              value={
                kpi.valueKind === 'count' ? (
                  <span
                    className={cn(
                      'text-heading-2 font-bold',
                      DASHBOARD_VALUE_TONE_CLASS[kpi.valueTone ?? 'default'],
                    )}
                  >
                    {kpi.amountPesewas.toLocaleString()}
                  </span>
                ) : (
                  <CurrencyAmount
                    value={kpi.amountPesewas}
                    className={DASHBOARD_VALUE_TONE_CLASS[kpi.valueTone ?? 'default']}
                  />
                )
              }
              trend={kpi.trendLabel}
              trendDirection={kpi.trendDirection}
              trendTone={kpi.trendTone}
            />
          ))}
        </div>

        {/* Group Risk + Quick Actions */}
        <div className="flex flex-col gap-4 lg:col-span-4">
          <GroupRiskCard segments={data.groupRisk} totalGroups={data.totalGroups} compact />

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-text-primary">Quick Actions</h2>
            <div className="grid gap-3">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={cn(
                    'group flex h-14 items-center gap-3 rounded-xl border px-5 py-3 text-sm font-semibold transition-all hover:shadow-md active:scale-[0.985]',
                    action.className
                  )}
                >
                  <DashboardQuickActionIcon name={action.icon} className="transition-transform group-hover:scale-110" />
                  {action.label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* === COLLECTION & EXPENSE SUMMARY - Grouped Section === */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <h2 className="text-2xl font-semibold text-text-primary">Financial Overview</h2>
          <p className="text-sm text-text-muted">Collection Performance &amp; Expense Summary</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-background p-5">
            <DashboardCollectionSummary compact />
          </div>
          <div className="rounded-xl border border-border bg-background p-5">
            <DashboardExpenseSummary compact />
          </div>
        </div>
      </section>

      {/* Borrower Status */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <h2 className="text-2xl font-semibold text-text-primary">Borrower Status</h2>
          <p className="text-sm text-text-muted">
            Total Borrowers:{' '}
            <span className="font-semibold text-text-primary">{borrowerTotal.toLocaleString()}</span>
          </p>
        </div>

        {borrowerTotal > 0 && (
          <>
            <div
              className="mt-6 flex h-5 overflow-hidden rounded-2xl"
              role="img"
              aria-label="Borrower status distribution"
            >
              {data.borrowerSegments.map((segment) => (
                <div
                  key={segment.id}
                  className={cn(
                    'h-full transition-all hover:brightness-110',
                    DASHBOARD_BORROWER_TONE_CLASS[segment.tone].bar
                  )}
                  style={{ width: `${(segment.count / borrowerTotal) * 100}%` }}
                />
              ))}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {data.borrowerSegments.map((segment) => (
                <div key={segment.id} className="flex items-center gap-3 rounded-lg bg-background p-3">
                  <span
                    className={cn(
                      'h-4 w-4 shrink-0 rounded-md',
                      DASHBOARD_BORROWER_TONE_CLASS[segment.tone].bar
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className={cn('truncate font-medium', DASHBOARD_BORROWER_TONE_CLASS[segment.tone].text)}>
                      {segment.label}
                    </p>
                    <p className="text-sm text-text-muted">{segment.count.toLocaleString()} borrowers</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-5 text-2xl font-semibold text-text-primary">Collector Performance</h2>
          <DashboardCollectorPerformance rows={data.collectorPerformance} />
        </section>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <DashboardCycleSnapshot metrics={data.cycleMetrics} />
        </div>
      </div>
    </div>
  );
}