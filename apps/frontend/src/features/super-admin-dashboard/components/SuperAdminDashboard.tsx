'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { CurrencyAmount, KpiCard } from '@/components/data-display';
import { GuidedEmptyState } from '@/components/feedback/GuidedEmptyState';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { ExecutiveKpiGrid } from '@/components/layout/executive';
import {
  DashboardKpiIcon,
  type DashboardKpiIconName,
} from '@/components/icons/DashboardKpiIcon';
import { DashboardQuickActionIcon } from '@/components/icons/DashboardQuickActionIcon';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  DASHBOARD_BORROWER_TONE_CLASS,
  DASHBOARD_VALUE_TONE_CLASS,
} from '@/constants/dashboard-display';
import { DashboardAlertsAside } from '@/features/super-admin-dashboard/components/DashboardAlertsAside';
import { DashboardCollectionSummary } from '@/features/super-admin-dashboard/components/DashboardCollectionSummary';
import { DashboardExpenseSummary } from '@/features/super-admin-dashboard/components/DashboardExpenseSummary';
import { DashboardReconciliationSummary } from '@/features/super-admin-dashboard/components/DashboardReconciliationSummary';
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
import { useReplayProductTour } from '@/components/onboarding/ProductTourOverlay';

const KPI_ICON_NAMES: Record<string, DashboardKpiIconName> = {
  pool: 'pool',
  disbursed: 'outstanding',
  collected: 'collected',
  'admin-fees': 'collected',
  outstanding: 'outstanding',
  'collected-today': 'collected',
  'collected-total': 'collected',
  'active-borrowers': 'pool',
};

const WORK_QUEUE: Array<{
  id: string;
  label: string;
  description: string;
  href: string;
  icon: 'approve' | 'variance' | 'audit';
  resolveCount: (data: NonNullable<ReturnType<typeof useDashboardSummary>['data']>) => number;
}> = [
  {
    id: 'approvals',
    label: 'Pending applications',
    description: 'Borrowers awaiting approval review',
    href: '/borrowers?status=PENDING',
    icon: 'approve',
    resolveCount: (data) =>
      data.borrowerSegments.find((segment) => segment.id === 'pending')?.count ?? 0,
  },
  {
    id: 'disbursements',
    label: 'Disbursements',
    description: 'Originate or track loan disbursement',
    href: '/loans',
    icon: 'approve',
    resolveCount: () => 0,
  },
  {
    id: 'collections',
    label: 'Today’s collections',
    description: 'Review daily collection progress',
    href: '/reports/daily-collection',
    icon: 'variance',
    resolveCount: () => 0,
  },
  {
    id: 'expenses',
    label: 'Expense review',
    description: 'Approve or reject submitted expenses',
    href: '/expenses',
    icon: 'approve',
    resolveCount: () => 0,
  },
  {
    id: 'reconciliation',
    label: 'Reconciliation',
    description: 'Review collector cash submissions',
    href: '/reports/daily-collection',
    icon: 'variance',
    resolveCount: () => 0,
  },
  {
    id: 'risk',
    label: 'Risk & flags',
    description: 'Investigate escalated risk signals',
    href: '/risk-flags',
    icon: 'audit',
    resolveCount: (data) =>
      data.groupRisk
        .filter((segment) => segment.tone === 'flagged' || segment.tone === 'atRisk')
        .reduce((sum, segment) => sum + segment.count, 0),
  },
];

const QUICK_ACTIONS = [
  {
    href: '/adjustments',
    label: 'Approve adjustment',
    icon: 'approve' as const,
    className: 'border-status-active text-status-active hover:bg-status-active-light',
  },
  {
    href: '/expenses',
    label: 'Review expenses',
    icon: 'approve' as const,
    className: 'border-brand-primary text-brand-primary hover:bg-brand-primary-light',
  },
  {
    href: '/reports/daily-collection',
    label: 'Review variance',
    icon: 'variance' as const,
    className: 'border-brand-primary text-brand-primary hover:bg-brand-primary-light',
  },
  {
    href: '/communication-center',
    label: 'Send broadcast',
    icon: 'audit' as const,
    className: 'border-status-info text-status-info hover:bg-status-info-light',
  },
  {
    href: '/settings?section=holidays',
    label: 'Review holidays',
    icon: 'approve' as const,
    className: 'border-brand-primary text-brand-primary hover:bg-brand-primary-light',
  },
];

export function SuperAdminDashboard() {
  const { data, isLoading, isError, error, refetch } = useDashboardSummary();
  const { showLoading, isTimedOut, isForbidden } = useQueryLoadingPolicy({
    isLoading,
    isError,
    error,
  });
  const alertsAside = useMemo(
    () => (data ? <DashboardAlertsAside alerts={data.recentAlerts} /> : null),
    [data],
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
        <OperationalDashboardContent
          data={data}
          borrowerTotal={data.borrowerSegments.reduce((sum, segment) => sum + segment.count, 0)}
        />
      ) : null}
    </QueryStatePanel>
  );
}

function OperationalDashboardContent({
  data,
  borrowerTotal,
}: {
  data: NonNullable<ReturnType<typeof useDashboardSummary>['data']>;
  borrowerTotal: number;
}) {
  const generatedBy = useWilmsExportActor();
  const replayTour = useReplayProductTour();
  const exportDocument = useMemo(
    () => buildDashboardExportDocument({ summary: data, generatedBy }),
    [data, generatedBy],
  );

  const operationalKpis = data.kpis.filter((kpi) =>
    ['collected-today', 'outstanding', 'active-borrowers', 'collected-total'].includes(kpi.id),
  );
  const displayKpis = operationalKpis.length > 0 ? operationalKpis : data.kpis.slice(0, 4);

  return (
    <div className="space-y-wilms-6" data-testid="operational-dashboard">
      <header className="flex flex-col gap-wilms-3 border-b border-border pb-wilms-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-small font-semibold uppercase tracking-wide text-brand-primary">
            Operational dashboard
          </p>
          <h1 className="text-heading-2 font-semibold text-text-primary">What needs attention today</h1>
          <p className="mt-wilms-1 max-w-xl text-small text-text-muted">
            Daily queues for approvals, collections, and reconciliation.{' '}
            <Link href="/executive" className="font-semibold text-brand-primary hover:underline">
              Executive view
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-wilms-2">
          <WilmsExportActions
            document={exportDocument}
            filenameBase="operational-dashboard"
            showIcons
            permissions={[]}
          />
          <Link
            href="/executive"
            className="inline-flex min-h-[44px] items-center rounded-sm border border-brand-primary px-wilms-4 text-small font-semibold text-brand-primary hover:bg-brand-primary-light"
          >
            Open executive view
          </Link>
        </div>
      </header>

      <div className="grid gap-wilms-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <DashboardReconciliationSummary compact />
        <Card aria-labelledby="ops-activity-heading">
          <CardHeader>
            <CardTitle id="ops-activity-heading">Recent activity</CardTitle>
            <CardDescription>Concise audit-backed summary</CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardRecentActivity limit={3} />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="collections">
        <TabsList aria-label="Operational summaries">
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>
        <TabsContent value="collections">
          <Card className="border-[color-mix(in_srgb,var(--color-status-active)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-status-active)_8%,var(--color-card))]">
            <CardContent>
              <DashboardCollectionSummary compact />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="expenses">
          <Card className="border-[color-mix(in_srgb,var(--color-status-at-risk)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-status-at-risk)_10%,var(--color-card))]">
            <CardContent>
              <DashboardExpenseSummary compact />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ExecutiveKpiGrid className="sm:grid-cols-2 xl:grid-cols-4">
        {displayKpis.map((kpi) => (
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

      <section aria-labelledby="work-queue-heading" className="space-y-wilms-3">
        <div>
          <h2 id="work-queue-heading" className="text-heading-3 font-semibold text-text-primary">
            Today’s work queue
          </h2>
          <p className="text-small text-text-muted">Jump into the highest-priority operational tasks.</p>
        </div>
        <ul className="grid gap-wilms-3 sm:grid-cols-2 xl:grid-cols-3">
          {WORK_QUEUE.map((item) => {
            const count = item.resolveCount(data);
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex min-h-[96px] flex-col justify-between rounded-sm border border-border bg-card p-wilms-4 transition-colors hover:border-brand-primary/50 hover:bg-brand-primary-light/20"
                >
                  <div className="flex items-start justify-between gap-wilms-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-text-primary">{item.label}</p>
                      <p className="mt-wilms-1 text-small text-text-muted">{item.description}</p>
                    </div>
                    <DashboardQuickActionIcon name={item.icon} className="shrink-0 text-brand-primary" />
                  </div>
                  {count > 0 ? (
                    <p className="mt-wilms-3 text-small font-semibold text-brand-primary">
                      {count.toLocaleString()} open
                    </p>
                  ) : (
                    <p className="mt-wilms-3 text-small text-text-muted">Open queue</p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid gap-wilms-6 xl:grid-cols-1">
        <Card aria-labelledby="ops-actions-heading">
          <CardHeader>
            <CardTitle id="ops-actions-heading">Quick actions</CardTitle>
          </CardHeader>
          <CardContent>
          <ul className="mt-wilms-4 grid gap-wilms-3 sm:grid-cols-2 lg:grid-cols-3">
            {QUICK_ACTIONS.map((action) => (
              <li key={action.href}>
                <Link
                  href={action.href}
                  className={cn(
                    'flex min-h-[48px] items-center gap-wilms-3 rounded-sm border px-wilms-4 py-wilms-3 text-body font-semibold',
                    action.className,
                  )}
                >
                  <DashboardQuickActionIcon name={action.icon} className="shrink-0" />
                  {action.label}
                </Link>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={replayTour}
                className="flex min-h-[48px] w-full items-center gap-wilms-3 rounded-sm border border-border px-wilms-4 py-wilms-3 text-left text-body font-semibold text-text-primary hover:border-brand-primary hover:bg-brand-primary-light"
              >
                <DashboardQuickActionIcon name="variance" className="shrink-0 text-brand-primary" />
                Replay product tour
              </button>
            </li>
          </ul>
          </CardContent>
        </Card>
      </div>

      <Card aria-labelledby="borrower-status-heading">
        <CardHeader className="flex-row flex-wrap items-end justify-between gap-wilms-2">
          <CardTitle id="borrower-status-heading">Borrower workflow status</CardTitle>
          <CardDescription>
            Total: <span className="font-semibold text-text-primary">{borrowerTotal.toLocaleString()}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
        {borrowerTotal === 0 ? (
          <div className="mt-wilms-4">
            <GuidedEmptyState
              title="No borrowers yet"
              description="Register or approve borrowers to populate today’s operational queues."
              actionHref="/borrowers"
              actionLabel="Open borrowers"
            />
          </div>
        ) : (
          <ul className="mt-wilms-4 grid gap-wilms-3 sm:grid-cols-2 xl:grid-cols-5">
            {data.borrowerSegments.map((segment) => (
              <li
                key={segment.id}
                className="flex items-center gap-wilms-3 rounded-sm border border-border bg-background p-wilms-3"
              >
                <span
                  className={cn('h-3 w-3 shrink-0 rounded-sm', DASHBOARD_BORROWER_TONE_CLASS[segment.tone].bar)}
                />
                <div className="min-w-0">
                  <p className={cn('truncate text-small font-semibold', DASHBOARD_BORROWER_TONE_CLASS[segment.tone].text)}>
                    {segment.label}
                  </p>
                  <p className="text-small text-text-muted">{segment.count.toLocaleString()}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
        </CardContent>
      </Card>
    </div>
  );
}
