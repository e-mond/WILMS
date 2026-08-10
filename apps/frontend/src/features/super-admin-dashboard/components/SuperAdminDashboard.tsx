'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { CurrencyAmount, KpiCard } from '@/components/data-display';
import { resolveKpiIcon } from '@/components/data-display/resolveKpiIcon';
import { GuidedEmptyState } from '@/components/feedback/GuidedEmptyState';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { ExecutiveKpiGrid } from '@/components/layout/executive';
import {
  DashboardKpiIcon,
  type DashboardKpiIconName,
} from '@/components/icons/DashboardKpiIcon';
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

const ATTENTION_ITEMS: Array<{
  id: string;
  label: string;
  href: string;
  resolveCount: (data: NonNullable<ReturnType<typeof useDashboardSummary>['data']>) => number;
}> = [
  {
    id: 'approvals',
    label: 'Pending applications',
    href: '/borrowers?status=PENDING',
    resolveCount: (data) =>
      data.borrowerSegments.find((segment) => segment.id === 'pending')?.count ?? 0,
  },
  {
    id: 'risk',
    label: 'Risk & flags',
    href: '/risk-flags',
    resolveCount: (data) =>
      data.groupRisk
        .filter((segment) => segment.tone === 'flagged' || segment.tone === 'atRisk')
        .reduce((sum, segment) => sum + segment.count, 0),
  },
  {
    id: 'reconciliation',
    label: 'Reconciliation review',
    href: '/reports/daily-collection',
    resolveCount: () => 0,
  },
  {
    id: 'expenses',
    label: 'Expense review',
    href: '/expenses',
    resolveCount: () => 0,
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
  const exportDocument = useMemo(
    () => buildDashboardExportDocument({ summary: data, generatedBy }),
    [data, generatedBy],
  );

  const operationalKpis = data.kpis.filter((kpi) =>
    ['collected-today', 'outstanding', 'active-borrowers', 'collected-total'].includes(kpi.id),
  );
  const displayKpis = operationalKpis.length > 0 ? operationalKpis : data.kpis.slice(0, 4);

  const attentionWithCounts = ATTENTION_ITEMS.map((item) => ({
    ...item,
    count: item.resolveCount(data),
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-wilms-6" data-testid="operational-dashboard">
      <header className="flex flex-col gap-wilms-3 border-b border-border/80 pb-wilms-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-small font-semibold uppercase tracking-wide text-brand-primary">
            Operations
          </p>
          <h1 className="text-heading-2 font-semibold text-text-primary">Financial operations</h1>
          <p className="mt-wilms-1 max-w-xl text-small text-text-muted">
            Portfolio state, reconciliation, and work that needs attention.{' '}
            <Link href="/executive" className="font-semibold text-brand-primary hover:underline">
              Executive intelligence
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
            className="inline-flex min-h-[44px] items-center rounded-full border border-brand-primary px-wilms-4 text-small font-semibold text-brand-primary hover:bg-brand-primary-light"
          >
            Executive view
          </Link>
        </div>
      </header>

      <ExecutiveKpiGrid className="sm:grid-cols-2 xl:grid-cols-4">
        {displayKpis.map((kpi) => (
          <KpiCard
            key={kpi.id}
            variant="executive"
            label={kpi.label}
            icon={
              KPI_ICON_NAMES[kpi.id] ? (
                <DashboardKpiIcon name={KPI_ICON_NAMES[kpi.id]} />
              ) : undefined
            }
            value={
              kpi.valueKind === 'count' ? (
                <span
                  className={cn(
                    'text-heading-2 font-semibold',
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

      <section aria-labelledby="attention-heading" className="space-y-wilms-3">
        <div>
          <h2 id="attention-heading" className="text-heading-3 font-semibold text-text-primary">
            Needs attention
          </h2>
          <p className="text-small text-text-muted">Priority queues with live counters where available.</p>
        </div>
        <ul className="grid gap-wilms-3 sm:grid-cols-2 xl:grid-cols-4">
          {attentionWithCounts.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex min-h-[88px] flex-col justify-between rounded-2xl border border-border/80 bg-card p-wilms-4 shadow-[var(--shadow-card)] transition-colors hover:border-brand-primary/40"
              >
                <div className="flex items-start justify-between gap-wilms-2">
                  <p className="font-semibold text-text-primary">{item.label}</p>
                  <span className="rounded-md bg-background p-1.5 text-text-muted" aria-hidden="true">
                    {resolveKpiIcon(item.label)}
                  </span>
                </div>
                <p
                  className={cn(
                    'mt-wilms-3 text-heading-3 font-semibold tabular-nums',
                    item.count > 0 ? 'text-brand-primary' : 'text-text-muted',
                  )}
                >
                  {item.count > 0 ? item.count.toLocaleString() : '—'}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-wilms-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <DashboardReconciliationSummary compact />
        <Card aria-labelledby="ops-activity-heading">
          <CardHeader>
            <CardTitle id="ops-activity-heading">Recent activity</CardTitle>
            <CardDescription>Latest operational changes</CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardRecentActivity limit={5} />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="collections">
        <TabsList aria-label="Operational summaries">
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>
        <TabsContent value="collections">
          <Card>
            <CardContent className="pt-wilms-4">
              <DashboardCollectionSummary compact />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="expenses">
          <Card>
            <CardContent className="pt-wilms-4">
              <DashboardExpenseSummary compact />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card aria-labelledby="borrower-status-heading">
        <CardHeader className="flex-row flex-wrap items-end justify-between gap-wilms-2">
          <CardTitle id="borrower-status-heading">Borrower status</CardTitle>
          <CardDescription>
            Total:{' '}
            <span className="font-semibold text-text-primary">{borrowerTotal.toLocaleString()}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {borrowerTotal === 0 ? (
            <GuidedEmptyState
              title="No borrowers yet"
              description="Register or approve borrowers to populate operational queues."
              actionHref="/borrowers"
              actionLabel="Open borrowers"
            />
          ) : (
            <ul className="grid gap-wilms-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {data.borrowerSegments.map((segment) => (
                <li
                  key={segment.id}
                  className="flex items-center gap-wilms-3 rounded-xl border border-border/70 bg-background/60 p-wilms-3"
                >
                  <span
                    className={cn(
                      'h-2.5 w-2.5 shrink-0 rounded-full',
                      DASHBOARD_BORROWER_TONE_CLASS[segment.tone].bar,
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'whitespace-normal break-words text-small font-semibold leading-tight',
                        DASHBOARD_BORROWER_TONE_CLASS[segment.tone].text,
                      )}
                    >
                      {segment.label}
                    </p>
                    <p className="text-small text-text-muted">{segment.count.toLocaleString()}</p>
                  </div>
                  <span className="shrink-0 rounded-md bg-background p-1.5 text-text-muted" aria-hidden="true">
                    {resolveKpiIcon(segment.label)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
