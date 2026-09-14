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
import { useReconciliationList } from '@/features/reconciliation/hooks/useReconciliationReview';
import { useShellAsideContent } from '@/hooks/useShellAsideContent';
import { useQueryLoadingPolicy } from '@/hooks/useQueryLoadingPolicy';
import { useAuth } from '@/hooks/useAuth';
import { useUiStore } from '@/state/uiStore';
import { DashboardRecentActivity } from '@/features/super-admin-dashboard/components/DashboardRecentActivity';
import { needsReconciliationReview } from '@/utils/reconciliation-review';
import { cn } from '@/utils/cn';
import { ArrowRight, Banknote, HandCoins, ListChecks, Search, ShieldAlert } from 'lucide-react';

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
  {
    id: 'adjustments',
    label: 'Adjustments',
    href: '/adjustments',
    resolveCount: () => 0,
  },
];

export function SuperAdminDashboard() {
  const { data, isLoading, isError, error, refetch } = useDashboardSummary();
  const { data: reconciliations } = useReconciliationList();
  const pendingReconciliationCount = useMemo(
    () => (reconciliations ?? []).filter(needsReconciliationReview).length,
    [reconciliations],
  );
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
          pendingReconciliationCount={pendingReconciliationCount}
        />
      ) : null}
    </QueryStatePanel>
  );
}

function OperationalDashboardContent({
  data,
  borrowerTotal,
  pendingReconciliationCount,
}: {
  data: NonNullable<ReturnType<typeof useDashboardSummary>['data']>;
  borrowerTotal: number;
  pendingReconciliationCount: number;
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
    count:
      item.id === 'reconciliation' ? pendingReconciliationCount : item.resolveCount(data),
  })).sort((a, b) => b.count - a.count);

  const { user } = useAuth();
  const openGlobalSearch = useUiStore((state) => state.openGlobalSearch);

  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const pendingApplicationsCount =
    data.borrowerSegments.find((segment) => segment.id === 'pending')?.count ?? 0;
  const riskFlagsCount = data.groupRisk
    .filter((segment) => segment.tone === 'flagged' || segment.tone === 'atRisk')
    .reduce((sum, segment) => sum + segment.count, 0);

  return (
    <div className="space-y-wilms-6" data-testid="operational-dashboard">
      {/* ─── Hero Banner (Inspired by Arman dashboard header) ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 text-white shadow-md sm:p-8">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute bottom-0 right-1/4 h-32 w-32 rounded-full bg-purple-500/15 blur-2xl"
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
            {timeGreeting}, {user?.displayName ?? 'Admin'} 👋
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
            Empowering Women.{' '}
            <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              Building Futures.
            </span>
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-300 sm:text-sm">
            Manage microloans, field collections, and community borrower health — all in one place.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={openGlobalSearch}
              className="flex h-11 w-full max-w-md items-center justify-between gap-3 rounded-full bg-white/10 px-4 text-xs text-slate-300 backdrop-blur-md transition-all hover:bg-white/20 hover:text-white sm:text-sm"
            >
              <div className="flex items-center gap-2.5">
                <Search className="h-4 w-4 text-indigo-300" aria-hidden="true" />
                <span>Search borrowers, loans, groups, or records…</span>
              </div>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary text-white shadow-xs">
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </button>
            <span className="hidden text-xs italic text-indigo-200/70 lg:inline">
              Interest-free impact. Everyday focus.
            </span>
          </div>
        </div>
      </div>

      {/* ─── Core Operations Overview (4 Pastel Category Cards) ─── */}
      <section aria-labelledby="operations-overview-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="operations-overview-heading" className="text-heading-3 font-bold text-text-primary">
              Operations Overview
            </h2>
            <p className="text-xs text-text-muted">Explore portfolio health, loan queues, and collections.</p>
          </div>
          <Link
            href="/loans"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
          >
            <span>View all</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Link
            href="/loans"
            className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-brand-primary/40 hover:shadow-sm motion-card-lift"
          >
            <div>
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-400"
                aria-hidden="true"
              >
                <HandCoins className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-bold text-text-primary">Active Portfolio</h3>
              <p className="mt-1 text-xs text-text-muted">
                {borrowerTotal.toLocaleString()} registered borrowers
              </p>
            </div>
            <div className="mt-4 flex justify-end">
              <span className="text-sm font-semibold text-text-muted transition-transform group-hover:translate-x-1 group-hover:text-brand-primary">
                →
              </span>
            </div>
          </Link>

          <Link
            href="/borrowers?status=PENDING"
            className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-brand-primary/40 hover:shadow-sm motion-card-lift"
          >
            <div>
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-400"
                aria-hidden="true"
              >
                <ListChecks className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-bold text-text-primary">Applications Queue</h3>
              <p className="mt-1 text-xs text-text-muted">
                {pendingApplicationsCount} pending review
              </p>
            </div>
            <div className="mt-4 flex justify-end">
              <span className="text-sm font-semibold text-text-muted transition-transform group-hover:translate-x-1 group-hover:text-brand-primary">
                →
              </span>
            </div>
          </Link>

          <Link
            href="/reports/daily-collection"
            className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-brand-primary/40 hover:shadow-sm motion-card-lift"
          >
            <div>
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-brand-primary dark:border-indigo-900/40 dark:bg-indigo-950/40 dark:text-indigo-400"
                aria-hidden="true"
              >
                <Banknote className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-bold text-text-primary">Daily Collections</h3>
              <p className="mt-1 text-xs text-text-muted">Reconciliation & field entries</p>
            </div>
            <div className="mt-4 flex justify-end">
              <span className="text-sm font-semibold text-text-muted transition-transform group-hover:translate-x-1 group-hover:text-brand-primary">
                →
              </span>
            </div>
          </Link>

          <Link
            href="/risk-flags"
            className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-brand-primary/40 hover:shadow-sm motion-card-lift"
          >
            <div>
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400"
                aria-hidden="true"
              >
                <ShieldAlert className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-bold text-text-primary">Risk & Flags</h3>
              <p className="mt-1 text-xs text-text-muted">
                {riskFlagsCount} flagged segments
              </p>
            </div>
            <div className="mt-4 flex justify-end">
              <span className="text-sm font-semibold text-text-muted transition-transform group-hover:translate-x-1 group-hover:text-brand-primary">
                →
              </span>
            </div>
          </Link>
        </div>
      </section>

      <header className="flex flex-col gap-wilms-3 border-b border-border/80 pb-wilms-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-small font-semibold uppercase tracking-wide text-brand-primary">
            Metrics & Reporting
          </p>
          <h1 className="text-heading-2 font-semibold text-text-primary">Financial operations</h1>
          <p className="mt-wilms-1 max-w-xl text-small text-text-muted">
            Live aggregates, capital rotation, and collection velocity.{' '}
            <Link href="/executive" className="font-semibold text-brand-primary hover:underline">
              Executive intelligence
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-wilms-2">
          <WilmsExportActions
            document={exportDocument}
            filenameBase="WILMS_Operational_Dashboard"
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
                className="flex min-h-[88px] flex-col justify-between rounded-2xl border border-border/80 bg-card p-wilms-4 shadow-xs transition-all hover:border-brand-primary/40 hover:shadow-sm motion-card-lift"
              >
                <div className="flex items-start justify-between gap-wilms-2">
                  <p className="font-semibold text-text-primary">{item.label}</p>
                  <span className="rounded-xl border border-border/60 bg-slate-50 p-2 text-text-muted dark:bg-slate-800" aria-hidden="true">
                    {resolveKpiIcon(item.label)}
                  </span>
                </div>
                <p
                  className={cn(
                    'mt-wilms-3 text-heading-3 font-bold tabular-nums',
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
            <ul className="grid grid-cols-1 gap-wilms-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {data.borrowerSegments.map((segment) => (
                <li
                  key={segment.id}
                  className="flex min-h-[5.5rem] items-start gap-wilms-3 rounded-xl border border-border bg-card p-wilms-3"
                >
                  <span
                    className={cn(
                      'mt-1 h-2.5 w-2.5 shrink-0 rounded-full',
                      DASHBOARD_BORROWER_TONE_CLASS[segment.tone].bar,
                    )}
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p
                      className={cn(
                        'text-small font-semibold leading-snug',
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
