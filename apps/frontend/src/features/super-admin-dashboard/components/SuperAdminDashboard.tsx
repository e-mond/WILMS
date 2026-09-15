'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { CurrencyAmount } from '@/components/data-display';
import { GuidedEmptyState } from '@/components/feedback/GuidedEmptyState';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { DASHBOARD_BORROWER_TONE_CLASS } from '@/constants/dashboard-display';
import { DashboardAlertsAside } from '@/features/super-admin-dashboard/components/DashboardAlertsAside';
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
import {
  ArrowRight,
  Banknote,
  ClipboardList,
  HandCoins,
  ListChecks,
  Ruler,
  Search,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react';

type DashboardSummaryData = NonNullable<ReturnType<typeof useDashboardSummary>['data']>;

const ACTION_CENTRE_ITEMS: Array<{
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  toneClass: string;
  resolveCount: (data: DashboardSummaryData) => number;
}> = [
  {
    id: 'pending-review',
    label: 'Pending review',
    href: '/borrowers?status=PENDING',
    icon: ListChecks,
    toneClass:
      'border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-400',
    resolveCount: (data) =>
      data.borrowerSegments.find((segment) => segment.id === 'pending')?.count ?? 0,
  },
  {
    id: 'overdue',
    label: 'Overdue',
    href: '/reports/missed-payments',
    icon: ClipboardList,
    toneClass:
      'border-rose-100 bg-rose-50 text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400',
    resolveCount: (data) =>
      data.recentAlerts.filter((alert) => alert.category === 'MISSED_PAYMENT').length,
  },
  {
    id: 'high-risk',
    label: 'High risk',
    href: '/risk-flags',
    icon: ShieldAlert,
    toneClass:
      'border-rose-100 bg-rose-50 text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400',
    resolveCount: (data) =>
      data.groupRisk
        .filter((segment) => segment.tone === 'flagged' || segment.tone === 'atRisk')
        .reduce((sum, segment) => sum + segment.count, 0),
  },
  {
    id: 'reconciliation',
    label: 'Reconciliation',
    href: '/reports/daily-collection',
    icon: Banknote,
    toneClass:
      'border-emerald-100 bg-emerald-50 text-brand-primary dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-400',
    resolveCount: () => 0,
  },
];

const OPS_NAV_ITEMS: Array<{
  id: string;
  title: string;
  href: string;
  icon: LucideIcon;
  toneClass: string;
  resolveDescription: (data: DashboardSummaryData, borrowerTotal: number) => string;
}> = [
  {
    id: 'portfolio',
    title: 'Active Portfolio',
    href: '/loans',
    icon: HandCoins,
    toneClass:
      'border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-400',
    resolveDescription: (_data, borrowerTotal) =>
      `${borrowerTotal.toLocaleString()} registered borrowers`,
  },
  {
    id: 'applications',
    title: 'Applications Queue',
    href: '/borrowers?status=PENDING',
    icon: ListChecks,
    toneClass:
      'border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-400',
    resolveDescription: (data) => {
      const pending =
        data.borrowerSegments.find((segment) => segment.id === 'pending')?.count ?? 0;
      return `${pending.toLocaleString()} pending review`;
    },
  },
  {
    id: 'collections',
    title: 'Daily Collections',
    href: '/reports/daily-collection',
    icon: Banknote,
    toneClass:
      'border-emerald-100 bg-emerald-50 text-brand-primary dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-400',
    resolveDescription: () => 'Reconciliation & field entries',
  },
  {
    id: 'risk',
    title: 'Risk & Flags',
    href: '/risk-flags',
    icon: ShieldAlert,
    toneClass:
      'border-rose-100 bg-rose-50 text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400',
    resolveDescription: (data) => {
      const riskFlagsCount = data.groupRisk
        .filter((segment) => segment.tone === 'flagged' || segment.tone === 'atRisk')
        .reduce((sum, segment) => sum + segment.count, 0);
      return `${riskFlagsCount.toLocaleString()} flagged segments`;
    },
  },
];

const BORROWER_STATUS_ORDER = ['active', 'atRisk', 'defaulted', 'blacklisted', 'pending'] as const;

const BORROWER_STATUS_HREF: Record<string, string> = {
  active: '/borrowers?status=APPROVED',
  atRisk: '/borrowers?status=AT_RISK',
  defaulted: '/borrowers?status=DEFAULTED',
  blacklisted: '/borrowers?status=BLACKLISTED',
  pending: '/borrowers?status=PENDING',
};

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
          pendingReconciliationCount={pendingReconciliationCount}
        />
      ) : null}
    </QueryStatePanel>
  );
}

function OperationalDashboardContent({
  data,
  pendingReconciliationCount,
}: {
  data: DashboardSummaryData;
  pendingReconciliationCount: number;
}) {
  const generatedBy = useWilmsExportActor();
  const exportDocument = useMemo(
    () => buildDashboardExportDocument({ summary: data, generatedBy }),
    [data, generatedBy],
  );

  const { user } = useAuth();
  const openGlobalSearch = useUiStore((state) => state.openGlobalSearch);

  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const overview = data.financialOverview;
  const kpiById = useMemo(() => {
    const map = new Map(data.kpis.map((kpi) => [kpi.id, kpi]));
    return map;
  }, [data.kpis]);

  const portfolioSummary = useMemo(() => {
    const disbursed = kpiById.get('disbursed')?.amountPesewas ?? 0;
    const collected = kpiById.get('collected')?.amountPesewas ?? 0;
    const outstanding = kpiById.get('outstanding')?.amountPesewas ?? 0;
    const pool = kpiById.get('pool')?.amountPesewas ?? 0;
    const collectionRate = overview?.collections.collectionRatePercent ?? 0;
    return { pool, disbursed, collected, outstanding, collectionRate };
  }, [kpiById, overview]);

  const actionItems = useMemo(() => {
    return ACTION_CENTRE_ITEMS.map((item) => ({
      ...item,
      count:
        item.id === 'reconciliation' ? pendingReconciliationCount : item.resolveCount(data),
    }));
  }, [data, pendingReconciliationCount]);

  const borrowerSegments = useMemo(() => {
    const byId = new Map(data.borrowerSegments.map((segment) => [segment.id, segment]));
    return BORROWER_STATUS_ORDER.map((id) => byId.get(id)).filter(
      (segment): segment is NonNullable<typeof segment> => Boolean(segment),
    );
  }, [data.borrowerSegments]);

  const borrowerStatusTotal = borrowerSegments.reduce((sum, segment) => sum + segment.count, 0);

  return (
    <div className="space-y-wilms-8" data-testid="operational-dashboard">
      {/* ─── Compact hero ─── */}
      <div className="rounded-2xl border border-border/80 bg-card px-wilms-5 py-wilms-5 sm:px-wilms-6">
        <div className="flex flex-col gap-wilms-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-small font-semibold uppercase tracking-wide text-brand-primary">
              {timeGreeting}, {user?.displayName ?? 'Admin'}
            </p>
            <h1 className="mt-wilms-1 text-heading-1 font-semibold text-text-primary">
              Operations Overview
            </h1>
            <p className="mt-wilms-1 text-small text-text-muted">
              Explore portfolio health, loan queues, and collections.
            </p>
          </div>
          <div className="flex w-full max-w-md flex-col gap-2 sm:w-auto">
            <button
              type="button"
              onClick={openGlobalSearch}
              className="inline-flex h-11 w-full items-center justify-between gap-3 rounded-full border border-border bg-background px-4 text-small text-text-muted transition-colors hover:border-brand-primary/40 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
            >
              <span className="flex items-center gap-2.5">
                <Search className="h-4 w-4 text-brand-primary" aria-hidden="true" />
                <span>Search borrowers, loans, groups…</span>
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary text-white">
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </button>
            <Link
              href="/settings?section=loan-rules"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-brand-primary/25 bg-brand-primary/5 px-4 text-small font-semibold text-brand-primary transition-colors hover:border-brand-primary/50 hover:bg-brand-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
            >
              <Ruler className="h-4 w-4" aria-hidden="true" />
              Loan rules
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Operations navigation cards ─── */}
      <section aria-labelledby="ops-nav-heading" className="space-y-wilms-3">
        <div className="flex items-center justify-between">
          <h2 id="ops-nav-heading" className="sr-only">
            Quick navigation
          </h2>
          <Link
            href="/loans"
            className="ml-auto inline-flex items-center gap-1 text-small font-semibold text-brand-primary hover:underline"
          >
            <span>View all</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-wilms-3 sm:grid-cols-2 xl:grid-cols-4">
          {OPS_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className="group flex flex-col justify-between rounded-xl border border-border/80 bg-card p-wilms-4 transition-colors hover:border-brand-primary/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
              >
                <div>
                  <span
                    className={cn(
                      'inline-flex h-10 w-10 items-center justify-center rounded-xl border',
                      item.toneClass,
                    )}
                    aria-hidden="true"
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-wilms-3 font-semibold text-text-primary">{item.title}</h3>
                  <p className="mt-wilms-1 text-small text-text-muted">
                    {item.resolveDescription(data, borrowerStatusTotal)}
                  </p>
                </div>
                <div className="mt-wilms-3 flex justify-end">
                  <span className="text-small font-semibold text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand-primary">
                    →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ─── Portfolio Summary ─── */}
      <section aria-labelledby="portfolio-summary-heading" className="space-y-wilms-3">
        <div className="flex items-center justify-between">
          <h2 id="portfolio-summary-heading" className="text-heading-3 font-semibold text-text-primary">
            Portfolio
          </h2>
          <Link
            href="/executive"
            className="inline-flex items-center gap-1 text-small font-semibold text-brand-primary hover:underline"
          >
            <span>Portfolio health</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="rounded-sm border border-border bg-card p-wilms-5 sm:p-wilms-6">
          <dl className="grid grid-cols-2 gap-wilms-4 sm:grid-cols-4">
            <div>
              <dt className="text-small font-semibold uppercase tracking-wide text-text-muted">
                Total portfolio
              </dt>
              <dd className="mt-wilms-1 text-heading-2 font-semibold text-text-primary">
                <CurrencyAmount value={portfolioSummary.pool} />
              </dd>
            </div>
            <div>
              <dt className="text-small font-semibold uppercase tracking-wide text-text-muted">
                Disbursed
              </dt>
              <dd className="mt-wilms-1 text-heading-2 font-semibold text-text-primary">
                <CurrencyAmount value={portfolioSummary.disbursed} />
              </dd>
            </div>
            <div>
              <dt className="text-small font-semibold uppercase tracking-wide text-text-muted">
                Repaid
              </dt>
              <dd className="mt-wilms-1 text-heading-2 font-semibold text-text-primary">
                <CurrencyAmount value={portfolioSummary.collected} />
              </dd>
            </div>
            <div>
              <dt className="text-small font-semibold uppercase tracking-wide text-text-muted">
                Outstanding
              </dt>
              <dd className="mt-wilms-1 text-heading-2 font-semibold text-text-primary">
                <CurrencyAmount value={portfolioSummary.outstanding} />
              </dd>
            </div>
          </dl>
          <div className="mt-wilms-4 flex items-center justify-between border-t border-border pt-wilms-4">
            <span className="text-small text-text-muted">Collection rate</span>
            <span
              className={cn(
                'text-heading-3 font-semibold tabular-nums',
                portfolioSummary.collectionRate >= 95
                  ? 'text-status-active'
                  : portfolioSummary.collectionRate < 70
                    ? 'text-danger'
                    : 'text-text-primary',
              )}
            >
              {portfolioSummary.collectionRate}%
            </span>
          </div>
        </div>
      </section>

      {/* ─── Action Centre ─── */}
      <section aria-labelledby="action-centre-heading" className="space-y-wilms-3">
        <div>
          <h2 id="action-centre-heading" className="text-heading-3 font-semibold text-text-primary">
            Action centre
          </h2>
          <p className="text-small text-text-muted">What needs your attention right now.</p>
        </div>
        <ul className="grid grid-cols-2 gap-wilms-3 sm:grid-cols-4">
          {actionItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex min-h-[88px] flex-col justify-between rounded-xl border border-border bg-card p-wilms-4 transition-colors hover:border-brand-primary/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
                >
                  <div className="flex items-start justify-between gap-wilms-2">
                    <span className="text-small font-medium text-text-muted">{item.label}</span>
                    <span
                      className={cn(
                        'inline-flex h-8 w-8 items-center justify-center rounded-lg border',
                        item.toneClass,
                      )}
                      aria-hidden="true"
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>
                  <span
                    className={cn(
                      'text-heading-2 font-semibold tabular-nums',
                      item.count > 0 ? 'text-text-primary' : 'text-text-muted',
                    )}
                  >
                    {item.count.toLocaleString()}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ─── Metrics & Reporting ─── */}
      <section aria-labelledby="metrics-reporting-heading" className="space-y-wilms-4">
        <div className="flex flex-wrap items-end justify-between gap-wilms-3 border-b border-border pb-wilms-3">
          <div>
            <h2
              id="metrics-reporting-heading"
              className="text-heading-3 font-semibold text-text-primary"
            >
              Metrics & reporting
            </h2>
            <p className="text-small text-text-muted">Live aggregates and collection performance.</p>
          </div>
          <WilmsExportActions
            document={exportDocument}
            filenameBase="WILMS_Operational_Dashboard"
            showIcons
            permissions={[]}
          />
        </div>

        <div className="grid gap-wilms-4 sm:grid-cols-2 xl:grid-cols-4">
          {data.cycleMetrics.map((metric) => (
            <div key={metric.label} className="rounded-sm border border-border bg-card p-wilms-4">
              <p className="text-small font-semibold uppercase tracking-wide text-text-muted">
                {metric.label}
              </p>
              <p className="mt-wilms-1 text-heading-3 font-semibold text-text-primary">
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <DashboardReconciliationSummary compact />

      {/* ─── Collections & Expenses ─── */}
      <section aria-labelledby="collections-expenses-heading" className="space-y-wilms-4">
        <div>
          <h2
            id="collections-expenses-heading"
            className="text-heading-3 font-semibold text-text-primary"
          >
            Collections & expenses
          </h2>
          <p className="text-small text-text-muted">Operational financial activity.</p>
        </div>
        <div className="grid gap-wilms-4 xl:grid-cols-2">
          <div className="rounded-sm border border-border bg-card p-wilms-5">
            <h3 className="text-small font-semibold uppercase tracking-wide text-text-muted">
              Collections
            </h3>
            <dl className="mt-wilms-4 grid grid-cols-3 gap-wilms-4">
              <div>
                <dt className="text-small text-text-muted">Expected</dt>
                <dd className="mt-wilms-1 text-heading-3 font-semibold text-text-primary">
                  <CurrencyAmount value={overview?.collections.amountDueThisWeekPesewas ?? 0} />
                </dd>
              </div>
              <div>
                <dt className="text-small text-text-muted">Collected</dt>
                <dd className="mt-wilms-1 text-heading-3 font-semibold text-text-primary">
                  <CurrencyAmount value={overview?.collections.totalAmountCollectedPesewas ?? 0} />
                </dd>
              </div>
              <div>
                <dt className="text-small text-text-muted">Rate</dt>
                <dd className="mt-wilms-1 text-heading-3 font-semibold text-text-primary">
                  {overview?.collections.collectionRatePercent ?? 0}%
                </dd>
              </div>
            </dl>
          </div>
          <div className="rounded-sm border border-border bg-card p-wilms-5">
            <h3 className="text-small font-semibold uppercase tracking-wide text-text-muted">
              Expenses
            </h3>
            <dl className="mt-wilms-4 grid grid-cols-3 gap-wilms-4">
              <div>
                <dt className="text-small text-text-muted">Submitted</dt>
                <dd className="mt-wilms-1 text-heading-3 font-semibold text-text-primary">
                  <CurrencyAmount value={overview?.expenses.totalExpensesPesewas ?? 0} />
                </dd>
              </div>
              <div>
                <dt className="text-small text-text-muted">Approved</dt>
                <dd className="mt-wilms-1 text-heading-3 font-semibold text-text-primary">
                  <CurrencyAmount value={overview?.expenses.operationalCostsPesewas ?? 0} />
                </dd>
              </div>
              <div>
                <dt className="text-small text-text-muted">Pending</dt>
                <dd className="mt-wilms-1 text-heading-3 font-semibold text-text-primary">
                  <CurrencyAmount value={overview?.expenses.cashOutflowPesewas ?? 0} />
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* ─── Borrower Status ─── */}
      <section aria-labelledby="borrower-status-heading" className="space-y-wilms-3">
        <div className="flex items-center justify-between">
          <div>
            <h2
              id="borrower-status-heading"
              className="text-heading-3 font-semibold text-text-primary"
            >
              Borrower status
            </h2>
            <p className="text-small text-text-muted">
              Distribution across {borrowerStatusTotal.toLocaleString()} borrowers.
            </p>
          </div>
          <Link
            href="/borrowers"
            className="inline-flex items-center gap-1 text-small font-semibold text-brand-primary hover:underline"
          >
            <span>View all</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {borrowerStatusTotal === 0 ? (
          <GuidedEmptyState
            title="No borrowers yet"
            description="Register or approve borrowers to populate operational queues."
            actionHref="/borrowers"
            actionLabel="Open borrowers"
          />
        ) : (
          <ul className="space-y-wilms-3">
            {borrowerSegments.map((segment) => {
              const percent =
                borrowerStatusTotal === 0
                  ? 0
                  : Math.round((segment.count / borrowerStatusTotal) * 100);
              const href = BORROWER_STATUS_HREF[segment.id] ?? '/borrowers';
              return (
                <li key={segment.id}>
                  <Link
                    href={href}
                    className="group flex items-center gap-wilms-3 rounded-sm border border-border bg-card p-wilms-3 transition-colors hover:border-brand-primary/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
                  >
                    <span
                      className={cn(
                        'h-2.5 w-2.5 shrink-0 rounded-full',
                        DASHBOARD_BORROWER_TONE_CLASS[segment.tone].bar,
                      )}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 text-small font-medium text-text-primary">
                      {segment.label}
                    </span>
                    <div
                      className="hidden h-2 w-32 overflow-hidden rounded-full bg-border sm:block"
                      role="img"
                      aria-label={`${segment.label}: ${percent}%`}
                    >
                      <div
                        className={cn(
                          'h-full rounded-full',
                          DASHBOARD_BORROWER_TONE_CLASS[segment.tone].bar,
                        )}
                        style={{ width: `${Math.max(percent, 2)}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-small font-semibold tabular-nums text-text-primary">
                      {segment.count.toLocaleString()}
                    </span>
                    <span className="shrink-0 text-small text-text-muted">{percent}%</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ─── Recent Activity ─── */}
      <section aria-labelledby="recent-activity-heading" className="space-y-wilms-3">
        <div className="flex items-center justify-between">
          <div>
            <h2
              id="recent-activity-heading"
              className="text-heading-3 font-semibold text-text-primary"
            >
              Recent activity
            </h2>
            <p className="text-small text-text-muted">Latest operational changes.</p>
          </div>
          <Link
            href="/reports/audit-log"
            className="inline-flex items-center gap-1 text-small font-semibold text-brand-primary hover:underline"
          >
            <span>Full audit log</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
        <DashboardRecentActivity limit={5} />
      </section>
    </div>
  );
}
