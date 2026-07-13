'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
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
import { DashboardReconciliationSummary } from '@/features/super-admin-dashboard/components/DashboardReconciliationSummary';
import { DashboardFinancialOverviewPanel } from '@/features/super-admin-dashboard/components/DashboardFinancialOverviewPanel';
import { DashboardFinancialAnalyticsPanel } from '@/features/super-admin-dashboard/components/DashboardFinancialAnalyticsPanel';
import {
  buildDashboardExportDocument,
  useWilmsExportActor,
  WilmsExportActions,
} from '@/features/export';
import { useDashboardSummary } from '@/features/super-admin-dashboard/hooks/useDashboardSummary';
import { useAuth } from '@/hooks/useAuth';
import { useShellAsideContent } from '@/hooks/useShellAsideContent';
import { useQueryLoadingPolicy } from '@/hooks/useQueryLoadingPolicy';
import { DashboardRecentActivity } from '@/features/super-admin-dashboard/components/DashboardRecentActivity';
import { cn } from '@/utils/cn';
import { Select } from '@/components/ui/Select';
import {
  readDashboardPreference,
  writeDashboardPreference,
} from '@/utils/dashboard-preferences';
import { useReplayProductTour } from '@/components/onboarding/ProductTourOverlay';

const KPI_ICON_NAMES: Record<string, DashboardKpiIconName> = {
  pool: 'pool',
  disbursed: 'outstanding',
  collected: 'collected',
  outstanding: 'outstanding',
  'collected-today': 'collected',
  'collected-total': 'collected',
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

function ProductTourQuickAction({ onReplay }: { onReplay: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onReplay}
        className="group flex min-h-[48px] w-full items-center gap-wilms-4 rounded-sm border border-border px-wilms-5 py-wilms-4 text-left text-body font-semibold text-text-primary transition-colors hover:border-brand-primary hover:bg-brand-primary-light hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
      >
        <DashboardQuickActionIcon name="variance" className="shrink-0 text-brand-primary" />
        <span className="min-w-0 break-words">Replay product tour</span>
      </button>
    </li>
  );
}

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
  const { user } = useAuth();
  const replayTour = useReplayProductTour();
  const [financialView, setFinancialView] = useState<'cards' | 'charts'>(() => {
    if (typeof window === 'undefined') {
      return 'cards';
    }
    return readDashboardPreference(user?.id, 'financial-view', 'cards') === 'charts'
      ? 'charts'
      : 'cards';
  });
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area' | 'pie'>(() => {
    if (typeof window === 'undefined') {
      return 'bar';
    }
    const stored = readDashboardPreference(user?.id, 'chart-type', 'bar');
    return stored === 'line' || stored === 'area' || stored === 'pie' ? stored : 'bar';
  });

  useEffect(() => {
    writeDashboardPreference(user?.id, 'financial-view', financialView);
  }, [financialView, user?.id]);

  useEffect(() => {
    writeDashboardPreference(user?.id, 'chart-type', chartType);
  }, [chartType, user?.id]);
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

      <div className="grid grid-cols-1 gap-wilms-6 lg:gap-wilms-8 xl:grid-cols-2">
        <GroupRiskCard segments={data.groupRisk} totalGroups={data.totalGroups} />

        <section
          aria-labelledby="dashboard-quick-actions-heading"
          className="rounded-sm border border-border bg-card p-wilms-5 sm:p-wilms-6 lg:p-wilms-8"
        >
          <div className="space-y-wilms-2">
            <h2
              id="dashboard-quick-actions-heading"
              className="text-heading-2 font-semibold text-text-primary"
            >
              Quick Actions
            </h2>
            <p className="text-small text-text-muted">Common supervisory workflows</p>
          </div>
          <ul className="mt-wilms-6 grid gap-wilms-4" role="list">
            {QUICK_ACTIONS.map((action) => (
              <li key={action.href}>
                <Link
                  href={action.href}
                  className={cn(
                    'group flex min-h-[48px] items-center gap-wilms-4 rounded-sm border px-wilms-5 py-wilms-4 text-body font-semibold transition-colors hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary',
                    action.className,
                  )}
                >
                  <DashboardQuickActionIcon
                    name={action.icon}
                    className="shrink-0 transition-transform group-hover:scale-105"
                  />
                  <span className="min-w-0 break-words">{action.label}</span>
                </Link>
              </li>
            ))}
            <ProductTourQuickAction onReplay={replayTour} />
          </ul>
        </section>
      </div>

      <section
        aria-labelledby="dashboard-financial-overview-heading"
        className="rounded-sm border border-border bg-card p-wilms-5 sm:p-wilms-6 lg:p-wilms-8"
        data-tour="financial-overview"
      >
        <div className="mb-wilms-6 flex flex-col gap-wilms-3 sm:flex-row sm:items-end sm:justify-between lg:mb-wilms-8">
          <div className="space-y-wilms-2">
            <h2
              id="dashboard-financial-overview-heading"
              className="text-heading-2 font-semibold text-text-primary"
            >
              Financial Overview
            </h2>
            <p className="text-small text-text-muted">
              Organisation-wide financial health from backend transactional data
            </p>
          </div>
          <div className="flex flex-col gap-wilms-2 sm:flex-row sm:items-center">
            <div
              className="inline-flex rounded-sm border border-border bg-background p-1"
              role="group"
              aria-label="Financial overview display mode"
            >
              <button
                type="button"
                className={cn(
                  'rounded-sm px-wilms-3 py-wilms-2 text-small font-semibold transition-colors',
                  financialView === 'cards'
                    ? 'bg-brand-primary text-card'
                    : 'text-text-muted hover:text-text-primary',
                )}
                onClick={() => setFinancialView('cards')}
              >
                Cards
              </button>
              <button
                type="button"
                className={cn(
                  'rounded-sm px-wilms-3 py-wilms-2 text-small font-semibold transition-colors',
                  financialView === 'charts'
                    ? 'bg-brand-primary text-card'
                    : 'text-text-muted hover:text-text-primary',
                )}
                onClick={() => setFinancialView('charts')}
              >
                Charts
              </button>
            </div>
            {financialView === 'charts' ? (
              <Select
                aria-label="Chart type"
                value={chartType}
                onChange={(event) =>
                  setChartType(event.target.value as 'bar' | 'line' | 'area' | 'pie')
                }
                className="h-10 min-w-[9rem] rounded-sm border border-border bg-card px-wilms-3 text-small"
              >
                <option value="bar">Bar</option>
                <option value="line">Line</option>
                <option value="area">Area</option>
                <option value="pie">Pie</option>
              </Select>
            ) : null}
          </div>
        </div>

        {data.financialOverview ? (
          <div className="mb-wilms-8">
            {financialView === 'charts' ? (
              <DashboardFinancialAnalyticsPanel
                overview={data.financialOverview}
                collectorPerformance={data.collectorPerformance ?? []}
                chartType={chartType}
              />
            ) : (
              <DashboardFinancialOverviewPanel overview={data.financialOverview} />
            )}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-wilms-6 lg:gap-wilms-8 xl:grid-cols-2">
          <div className="min-w-0 rounded-sm border border-border bg-background p-wilms-5 sm:p-wilms-6">
            <DashboardCollectionSummary compact />
          </div>
          <div className="min-w-0 rounded-sm border border-border bg-background p-wilms-5 sm:p-wilms-6">
            <DashboardExpenseSummary compact />
          </div>
        </div>

        <div className="min-w-0 rounded-sm border border-border bg-background p-wilms-5 sm:p-wilms-6">
          <DashboardReconciliationSummary compact />
        </div>
      </section>

      <section
        aria-labelledby="dashboard-borrower-status-heading"
        className="rounded-sm border border-border bg-card p-wilms-5 sm:p-wilms-6 lg:p-wilms-8"
      >
        <div className="flex flex-col justify-between gap-wilms-3 sm:flex-row sm:items-end">
          <h2
            id="dashboard-borrower-status-heading"
            className="text-heading-2 font-semibold text-text-primary"
          >
            Borrower Status
          </h2>
          <p className="text-small text-text-muted">
            Total borrowers:{' '}
            <span className="font-semibold text-text-primary">{borrowerTotal.toLocaleString()}</span>
          </p>
        </div>

        {borrowerTotal > 0 && (
          <>
            <div
              className="mt-wilms-6 flex h-5 overflow-hidden rounded-sm sm:mt-wilms-8"
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

            <ul
              className="mt-wilms-6 grid grid-cols-1 gap-wilms-4 sm:mt-wilms-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5"
              role="list"
            >
              {data.borrowerSegments.map((segment) => (
                <li
                  key={segment.id}
                  className="flex min-w-0 items-center gap-wilms-4 rounded-sm border border-border bg-background p-wilms-4 sm:p-wilms-5"
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
                </li>
              ))}
            </ul>
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
          <DashboardCollectorPerformance rows={data.collectorPerformance ?? []} />
        </section>

        <div className="min-w-0 rounded-sm border border-border bg-card p-wilms-5">
          <DashboardCycleSnapshot metrics={data.cycleMetrics} />
        </div>
      </div>
    </div>
  );
}