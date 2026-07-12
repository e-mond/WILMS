'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { CurrencyAmount, GroupRiskCard, KpiCard } from '@/components/data-display';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { ExecutiveKpiGrid } from '@/components/layout/executive';
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
import {
  buildDashboardExportDocument,
  useWilmsExportActor,
  WilmsExportActions,
} from '@/features/export';
import { useDashboardSummary } from '@/features/super-admin-dashboard/hooks/useDashboardSummary';
import { useShellAsideContent } from '@/hooks/useShellAsideContent';
import { useQueryLoadingPolicy } from '@/hooks/useQueryLoadingPolicy';
import { DashboardRecentActivity } from '@/features/super-admin-dashboard/components/DashboardRecentActivity';
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
  const { data, isLoading, isError, error, refetch } = useDashboardSummary();
  const { showLoading, isTimedOut, isForbidden } = useQueryLoadingPolicy({ isLoading, isError, error });
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
      isError={isError}
      error={error}
      isForbidden={isForbidden}
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
  const generatedBy = useWilmsExportActor();
  const exportDocument = useMemo(
    () => buildDashboardExportDocument({ summary: data, generatedBy }),
    [data, generatedBy],
  );

  return (
    <div className="space-y-wilms-6">
      <div className="flex flex-wrap items-center justify-end gap-wilms-2">
        <WilmsExportActions
          document={exportDocument}
          filenameBase="executive-dashboard"
          showIcons
          permissions={[]}
        />
      </div>

      <ExecutiveKpiGrid>
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
      </ExecutiveKpiGrid>

      <div className="grid grid-cols-1 gap-wilms-5 xl:grid-cols-2">
        <GroupRiskCard segments={data.groupRisk} totalGroups={data.totalGroups} />

        <section className="rounded-sm border border-border bg-card p-wilms-5">
          <h2 className="text-heading-2 font-semibold text-text-primary">Quick Actions</h2>
          <p className="mt-wilms-1 text-small text-text-muted">Common supervisory workflows</p>
          <div className="mt-wilms-5 grid gap-wilms-3">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={cn(
                  'group flex min-h-[48px] items-center gap-wilms-3 rounded-sm border px-wilms-4 py-wilms-3 text-body font-semibold transition-colors hover:shadow-sm',
                  action.className,
                )}
              >
                <DashboardQuickActionIcon
                  name={action.icon}
                  className="shrink-0 transition-transform group-hover:scale-105"
                />
                <span className="whitespace-nowrap">{action.label}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-sm border border-border bg-card p-wilms-6">
        <div className="mb-wilms-6 flex flex-col gap-wilms-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-heading-2 font-semibold text-text-primary">Financial Overview</h2>
            <p className="mt-wilms-1 text-small text-text-muted">
              Collection performance and expense summary side by side
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-wilms-6 xl:grid-cols-2">
          <div className="min-w-0 rounded-sm border border-border bg-background p-wilms-5">
            <DashboardCollectionSummary compact />
          </div>
          <div className="min-w-0 rounded-sm border border-border bg-background p-wilms-5">
            <DashboardExpenseSummary compact />
          </div>
        </div>
      </section>

      <section className="rounded-sm border border-border bg-card p-wilms-5">
        <div className="flex flex-col justify-between gap-wilms-2 sm:flex-row sm:items-end">
          <h2 className="text-heading-2 font-semibold text-text-primary">Borrower Status</h2>
          <p className="text-small text-text-muted">
            Total borrowers:{' '}
            <span className="font-semibold text-text-primary">{borrowerTotal.toLocaleString()}</span>
          </p>
        </div>

        {borrowerTotal > 0 && (
          <>
            <div
              className="mt-wilms-5 flex h-5 overflow-hidden rounded-sm"
              role="img"
              aria-label="Borrower status distribution"
            >
              {data.borrowerSegments.map((segment) => (
                <div
                  key={segment.id}
                  className={cn(
                    'h-full transition-all hover:brightness-110',
                    DASHBOARD_BORROWER_TONE_CLASS[segment.tone].bar,
                  )}
                  style={{ width: `${(segment.count / borrowerTotal) * 100}%` }}
                />
              ))}
            </div>

            <div className="mt-wilms-5 grid grid-cols-1 gap-wilms-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
              {data.borrowerSegments.map((segment) => (
                <div
                  key={segment.id}
                  className="flex min-w-0 items-center gap-wilms-3 rounded-sm border border-border bg-background p-wilms-3"
                >
                  <span
                    className={cn(
                      'h-4 w-4 shrink-0 rounded-sm',
                      DASHBOARD_BORROWER_TONE_CLASS[segment.tone].bar,
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'truncate font-medium',
                        DASHBOARD_BORROWER_TONE_CLASS[segment.tone].text,
                      )}
                    >
                      {segment.label}
                    </p>
                    <p className="text-small text-text-muted">
                      {segment.count.toLocaleString()} borrowers
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="rounded-sm border border-border bg-card p-wilms-5">
        <div className="mb-wilms-4 flex flex-col gap-wilms-1 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-heading-2 font-semibold text-text-primary">Recent Activity</h2>
          <p className="text-small text-text-muted">What needs attention right now</p>
        </div>
        <DashboardRecentActivity alerts={data.recentAlerts} />
      </section>

      <div className="grid grid-cols-1 gap-wilms-5 xl:grid-cols-2">
        <section className="min-w-0 rounded-sm border border-border bg-card p-wilms-5">
          <h2 className="mb-wilms-4 text-heading-2 font-semibold text-text-primary">
            Collector Performance
          </h2>
          <DashboardCollectorPerformance rows={data.collectorPerformance} />
        </section>

        <div className="min-w-0 rounded-sm border border-border bg-card p-wilms-5">
          <DashboardCycleSnapshot metrics={data.cycleMetrics} />
        </div>
      </div>
    </div>
  );
}