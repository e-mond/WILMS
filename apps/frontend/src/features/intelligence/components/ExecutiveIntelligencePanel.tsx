'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Banknote,
  BellRing,
  CircleCheck,
  FileX2,
  HandCoins,
  Percent,
  PieChart,
  Send,
  Timer,
  TrendingUp,
  UserRound,
  UsersRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { CurrencyAmount } from '@/components/data-display';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ExportCsvButton } from '@/features/reports/components/ExportCsvButton';
import { WILMS_REPORT_TYPE } from '@/features/export';
import { ExecutiveAsidePanel } from '@/features/intelligence/components/ExecutiveAsidePanel';
import { useQueryLoadingPolicy } from '@/hooks/useQueryLoadingPolicy';
import { useShellAsideContent } from '@/hooks/useShellAsideContent';
import { intelligenceService } from '@/services/intelligenceService';
import type { ExecutiveDashboard } from '@/types/intelligence';
import { formatPesewasForCsv } from '@/utils/export-csv';
import { cn } from '@/utils/cn';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function MetricTile({
  label,
  value,
  icon: Icon,
  toneClass,
  valueClassName,
  href,
  detail,
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  toneClass: string;
  valueClassName?: string;
  href?: string;
  detail?: string;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-wilms-2">
        <p className="text-small font-medium text-text-muted">{label}</p>
        <span
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-lg border',
            toneClass,
          )}
          aria-hidden="true"
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className={cn('mt-wilms-3 text-heading-2 font-semibold tabular-nums text-text-primary', valueClassName)}>
        {value}
      </div>
      {detail ? <p className="mt-wilms-1 text-small text-text-muted">{detail}</p> : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-xl border border-border bg-card p-wilms-4 transition-colors hover:border-brand-primary/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
      >
        {body}
      </Link>
    );
  }

  return <div className="rounded-xl border border-border bg-card p-wilms-4">{body}</div>;
}

export function ExecutiveIntelligencePanel() {
  const [communityDraft, setCommunityDraft] = useState('');
  const [community, setCommunity] = useState('');
  const [asOf, setAsOf] = useState(todayIso);

  const dashboardQuery = useQuery({
    queryKey: ['intelligence', 'executive-dashboard', community, asOf] as const,
    queryFn: () =>
      intelligenceService.getExecutiveDashboard({
        community: community || undefined,
        asOf: asOf || undefined,
      }),
  });

  const { showLoading, isTimedOut, isForbidden } = useQueryLoadingPolicy({
    isLoading: dashboardQuery.isLoading,
    isError: dashboardQuery.isError,
    error: dashboardQuery.error,
  });

  const applyFilters = () => {
    setCommunity(communityDraft.trim());
  };

  const asideContent = useMemo(
    () =>
      dashboardQuery.data ? <ExecutiveAsidePanel dashboard={dashboardQuery.data} /> : null,
    [dashboardQuery.data],
  );
  useShellAsideContent(asideContent);

  const heroMetrics = dashboardQuery.data
    ? {
        collectionRate: dashboardQuery.data.financial?.collectionRatePercent ?? 0,
        outstanding: dashboardQuery.data.financial?.outstandingPesewas ?? 0,
        par30: dashboardQuery.data.risk?.par30RatePercent ?? 0,
        activeLoans: dashboardQuery.data.operational?.activeLoans ?? 0,
      }
    : null;

  return (
    <div className="space-y-wilms-8 print:space-y-4" data-testid="executive-intelligence">
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card">
        <div className="bg-gradient-to-br from-brand-primary/[0.07] via-transparent to-transparent px-wilms-5 py-wilms-5 sm:px-wilms-6 sm:py-wilms-6">
          <div className="flex flex-col gap-wilms-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-small font-semibold uppercase tracking-wide text-brand-primary">
                Executive intelligence
              </p>
              <h1 className="mt-wilms-1 text-heading-1 font-semibold text-text-primary">
                Portfolio Health
              </h1>
              <p className="mt-wilms-1 max-w-2xl text-small text-text-muted">
                Board-ready view of portfolio value, collections, and delinquency. Charts and
                forecasts sit in the side panel.{' '}
                <Link href="/dashboard" className="font-semibold text-brand-primary hover:underline">
                  Operations Overview
                </Link>
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-wilms-2 print:hidden">
              <label className="block text-small text-text-muted">
                Community
                <Input
                  className="mt-1 w-44"
                  value={communityDraft}
                  onChange={(event) => setCommunityDraft(event.target.value)}
                  placeholder="All communities"
                />
              </label>
              <label className="block text-small text-text-muted">
                As of
                <Input
                  type="date"
                  className="mt-1 w-40"
                  value={asOf}
                  onChange={(event) => setAsOf(event.target.value)}
                />
              </label>
              <Button type="button" variant="secondary" onClick={applyFilters}>
                Apply
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void dashboardQuery.refetch()}
                disabled={dashboardQuery.isFetching}
              >
                {dashboardQuery.isFetching ? 'Refreshing…' : 'Refresh'}
              </Button>
            </div>
          </div>

          {heroMetrics ? (
            <dl className="mt-wilms-5 grid grid-cols-2 gap-wilms-3 border-t border-border/70 pt-wilms-4 sm:grid-cols-4">
              <div className="rounded-xl border border-border/70 bg-card/80 px-wilms-3 py-wilms-3">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  Collection rate
                </dt>
                <dd
                  className={cn(
                    'mt-1 text-heading-3 font-semibold tabular-nums',
                    heroMetrics.collectionRate >= 95
                      ? 'text-status-active'
                      : heroMetrics.collectionRate < 70
                        ? 'text-danger'
                        : 'text-text-primary',
                  )}
                >
                  {heroMetrics.collectionRate}%
                </dd>
              </div>
              <div className="rounded-xl border border-border/70 bg-card/80 px-wilms-3 py-wilms-3">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  Outstanding
                </dt>
                <dd className="mt-1 text-heading-3 font-semibold text-text-primary">
                  <CurrencyAmount value={heroMetrics.outstanding} />
                </dd>
              </div>
              <div className="rounded-xl border border-border/70 bg-card/80 px-wilms-3 py-wilms-3">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  PAR30
                </dt>
                <dd className="mt-1 text-heading-3 font-semibold tabular-nums text-status-at-risk">
                  {heroMetrics.par30}%
                </dd>
              </div>
              <div className="rounded-xl border border-border/70 bg-card/80 px-wilms-3 py-wilms-3">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  Active loans
                </dt>
                <dd className="mt-1 text-heading-3 font-semibold tabular-nums text-text-primary">
                  {heroMetrics.activeLoans.toLocaleString()}
                </dd>
              </div>
            </dl>
          ) : null}
        </div>
      </div>

      <QueryStatePanel
        isLoading={dashboardQuery.isLoading}
        showLoading={showLoading}
        isTimedOut={isTimedOut}
        isError={dashboardQuery.isError}
        error={dashboardQuery.error}
        errorMessage="Unable to load executive intelligence."
        isForbidden={isForbidden}
        onRetry={() => void dashboardQuery.refetch()}
        variant="cards"
      >
        {dashboardQuery.data ? (
          <ExecutiveDashboardContent data={dashboardQuery.data} />
        ) : null}
      </QueryStatePanel>
    </div>
  );
}

function ExecutiveDashboardContent({ data }: { data: ExecutiveDashboard }) {
  const financial = data.financial ?? {};
  const operational = data.operational ?? {};
  const risk = data.risk ?? {};

  const csvRows = useMemo(
    () => [
      ['As of', data.asOfDate],
      ['Community', data.filters.community ?? ''],
      ['Total portfolio (GHS)', formatPesewasForCsv(data.financial?.totalPortfolioPesewas ?? 0)],
      ['Outstanding (GHS)', formatPesewasForCsv(data.financial?.outstandingPesewas ?? 0)],
      ['Collected (GHS)', formatPesewasForCsv(data.financial?.collectedPesewas ?? 0)],
      ['Collection rate %', String(data.financial?.collectionRatePercent ?? '')],
      ['Recovery rate %', String(data.financial?.recoveryRatePercent ?? '')],
      ['PAR30 rate %', String(data.risk?.par30RatePercent ?? '')],
      ['Active loans', String(data.operational?.activeLoans ?? '')],
      ['Active borrowers', String(data.operational?.activeBorrowers ?? '')],
    ],
    [data],
  );

  const parBands = [
    {
      id: 'par30',
      label: 'PAR30',
      count: risk.par30Count ?? 0,
      rate: risk.par30RatePercent ?? 0,
      bar: 'bg-status-at-risk',
      text: 'text-status-at-risk',
    },
    {
      id: 'par60',
      label: 'PAR60',
      count: risk.par60Count ?? 0,
      rate: risk.par60RatePercent ?? 0,
      bar: 'bg-warning',
      text: 'text-warning',
    },
    {
      id: 'par90',
      label: 'PAR90',
      count: risk.par90Count ?? 0,
      rate: risk.par90RatePercent ?? 0,
      bar: 'bg-danger',
      text: 'text-danger',
    },
  ] as const;

  const maxParRate = Math.max(...parBands.map((band) => band.rate), 1);
  const collectionRate = financial.collectionRatePercent ?? 0;

  return (
    <div className="space-y-wilms-8 print:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-wilms-3">
        <p className="text-small text-text-muted">
          Generated {new Date(data.generatedAt).toLocaleString()}
          {data.filters.community ? ` · ${data.filters.community}` : ''}
          {` · As of ${data.asOfDate}`}
        </p>
        <div className="flex flex-wrap gap-wilms-2 print:hidden">
          <ExportCsvButton
            label="Export board report"
            filename={`WILMS_Executive_Board_Report_${data.asOfDate}.csv`}
            reportType={WILMS_REPORT_TYPE.GENERIC_REPORT}
            reportTitle="Executive Board Report"
            executiveSummary={`Board KPI summary as of ${data.asOfDate}${data.filters.community ? ` for ${data.filters.community}` : ''}.`}
            headers={['Metric', 'Value']}
            rows={csvRows}
          />
          <Button type="button" variant="secondary" onClick={() => window.print()}>
            Print
          </Button>
        </div>
      </div>

      {/* Portfolio position */}
      <section aria-labelledby="portfolio-position-heading" className="space-y-wilms-3">
        <div className="flex items-center justify-between gap-wilms-3">
          <div>
            <h2 id="portfolio-position-heading" className="text-heading-3 font-semibold text-text-primary">
              Portfolio
            </h2>
            <p className="text-small text-text-muted">Board-level liquidity and portfolio position</p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-small font-semibold text-brand-primary hover:underline"
          >
            <span>Operations Overview</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="rounded-sm border border-border bg-card p-wilms-5 sm:p-wilms-6">
          <dl className="grid grid-cols-2 gap-wilms-4 sm:grid-cols-4">
            <div>
              <dt className="text-small font-semibold uppercase tracking-wide text-text-muted">
                Total portfolio
              </dt>
              <dd className="mt-wilms-1 text-heading-2 font-semibold text-text-primary">
                <CurrencyAmount value={financial.totalPortfolioPesewas ?? 0} />
              </dd>
            </div>
            <div>
              <dt className="text-small font-semibold uppercase tracking-wide text-text-muted">
                Disbursed
              </dt>
              <dd className="mt-wilms-1 text-heading-2 font-semibold text-text-primary">
                <CurrencyAmount value={financial.disbursedPesewas ?? 0} />
              </dd>
            </div>
            <div>
              <dt className="text-small font-semibold uppercase tracking-wide text-text-muted">
                Collected
              </dt>
              <dd className="mt-wilms-1 text-heading-2 font-semibold text-text-primary">
                <CurrencyAmount value={financial.collectedPesewas ?? 0} />
              </dd>
            </div>
            <div>
              <dt className="text-small font-semibold uppercase tracking-wide text-text-muted">
                Outstanding
              </dt>
              <dd className="mt-wilms-1 text-heading-2 font-semibold text-text-primary">
                <CurrencyAmount value={financial.outstandingPesewas ?? 0} />
              </dd>
            </div>
          </dl>
          <div className="mt-wilms-4 flex items-center justify-between border-t border-border pt-wilms-4">
            <span className="text-small text-text-muted">Collection rate</span>
            <span
              className={cn(
                'text-heading-3 font-semibold tabular-nums',
                collectionRate >= 95
                  ? 'text-status-active'
                  : collectionRate < 70
                    ? 'text-danger'
                    : 'text-text-primary',
              )}
            >
              {collectionRate}%
            </span>
          </div>
        </div>
      </section>

      {/* Cash & recovery */}
      <section aria-labelledby="cash-recovery-heading" className="space-y-wilms-3">
        <div>
          <h2 id="cash-recovery-heading" className="text-heading-3 font-semibold text-text-primary">
            Cash & recovery
          </h2>
          <p className="text-small text-text-muted">Operating liquidity and recovery performance</p>
        </div>
        <div className="grid grid-cols-2 gap-wilms-3 xl:grid-cols-4">
          <MetricTile
            label="Operating cash"
            icon={Wallet}
            toneClass="border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-400"
            value={<CurrencyAmount value={financial.liquidityPesewas ?? 0} />}
          />
          <MetricTile
            label="Expense ratio"
            icon={PieChart}
            toneClass="border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            value={`${financial.expenseRatioPercent ?? 0}%`}
          />
          <MetricTile
            label="Recovery rate"
            icon={TrendingUp}
            toneClass="border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/40 dark:text-sky-400"
            value={`${financial.recoveryRatePercent ?? 0}%`}
          />
          <MetricTile
            label="Write-offs"
            icon={FileX2}
            toneClass="border-rose-100 bg-rose-50 text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400"
            value={<CurrencyAmount value={financial.writeOffsPesewas ?? 0} />}
            href="/reports/write-offs"
          />
        </div>
      </section>

      {/* Delinquency & PAR */}
      <section aria-labelledby="delinquency-heading" className="space-y-wilms-3">
        <div className="flex items-center justify-between gap-wilms-3">
          <div>
            <h2 id="delinquency-heading" className="text-heading-3 font-semibold text-text-primary">
              Delinquency & PAR
            </h2>
            <p className="text-small text-text-muted">
              Portfolio at risk across 30 / 60 / 90 day bands
            </p>
          </div>
          <Link
            href="/reports/aging-analysis"
            className="inline-flex items-center gap-1 text-small font-semibold text-brand-primary hover:underline"
          >
            <span>Aging analysis</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <ul className="space-y-wilms-3">
          {parBands.map((band) => {
            const widthPercent = Math.max(4, Math.round((band.rate / maxParRate) * 100));
            return (
              <li key={band.id}>
                <Link
                  href="/reports/aging-analysis"
                  className="flex items-center gap-wilms-3 rounded-sm border border-border bg-card p-wilms-3 transition-colors hover:border-brand-primary/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
                >
                  <span
                    className={cn('h-2.5 w-2.5 shrink-0 rounded-full', band.bar)}
                    aria-hidden="true"
                  />
                  <span className={cn('min-w-[4.5rem] text-small font-semibold', band.text)}>
                    {band.label}
                  </span>
                  <div
                    className="hidden h-2 flex-1 overflow-hidden rounded-full bg-border sm:block"
                    role="img"
                    aria-label={`${band.label}: ${band.rate}%`}
                  >
                    <div
                      className={cn('h-full rounded-full', band.bar)}
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-small font-semibold tabular-nums text-text-primary">
                    {band.count.toLocaleString()}
                  </span>
                  <span className="shrink-0 text-small tabular-nums text-text-muted">{band.rate}%</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Scale & productivity */}
      <section aria-labelledby="scale-heading" className="space-y-wilms-3">
        <div>
          <h2 id="scale-heading" className="text-heading-3 font-semibold text-text-primary">
            Scale & productivity
          </h2>
          <p className="text-small text-text-muted">Active book size and operational throughput</p>
        </div>
        <div className="grid grid-cols-2 gap-wilms-3 xl:grid-cols-3">
          <MetricTile
            label="Active groups"
            icon={UsersRound}
            toneClass="border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-400"
            value={(operational.activeGroups ?? 0).toLocaleString()}
            href="/groups"
          />
          <MetricTile
            label="Active borrowers"
            icon={UserRound}
            toneClass="border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-400"
            value={(operational.activeBorrowers ?? 0).toLocaleString()}
            href="/borrowers?status=APPROVED"
          />
          <MetricTile
            label="Active loans"
            icon={HandCoins}
            toneClass="border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/40 dark:text-sky-400"
            value={(operational.activeLoans ?? 0).toLocaleString()}
            href="/loans"
          />
          <MetricTile
            label="Closed loans"
            icon={CircleCheck}
            toneClass="border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            value={(operational.closedLoans ?? 0).toLocaleString()}
            href="/loans"
          />
          <MetricTile
            label="Reconciliation alerts"
            icon={BellRing}
            toneClass="border-rose-100 bg-rose-50 text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400"
            value={(operational.reconciliationAlerts ?? 0).toLocaleString()}
            detail="Pending review + missing submits"
            href="/reports/daily-collection"
            valueClassName={
              (operational.reconciliationAlerts ?? 0) > 0 ? 'text-danger' : undefined
            }
          />
          <MetricTile
            label="Notifications sent"
            icon={Send}
            toneClass="border-violet-100 bg-violet-50 text-violet-700 dark:border-violet-900/40 dark:bg-violet-950/40 dark:text-violet-400"
            value={(operational.notificationSent ?? 0).toLocaleString()}
            detail="Last 30 days"
            href="/communication-center"
          />
        </div>
      </section>

      {/* Compact performance strip */}
      <section
        aria-labelledby="performance-strip-heading"
        className="rounded-sm border border-border bg-card p-wilms-5"
      >
        <h2 id="performance-strip-heading" className="sr-only">
          Performance summary
        </h2>
        <dl className="grid grid-cols-1 gap-wilms-4 sm:grid-cols-3">
          <div className="flex items-center gap-wilms-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-brand-primary dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Percent className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <dt className="text-small text-text-muted">Collection rate</dt>
              <dd className="text-heading-3 font-semibold tabular-nums text-text-primary">
                {collectionRate}%
              </dd>
            </div>
          </div>
          <div className="flex items-center gap-wilms-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-400">
              <Timer className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <dt className="text-small text-text-muted">PAR30 rate</dt>
              <dd className="text-heading-3 font-semibold tabular-nums text-status-at-risk">
                {risk.par30RatePercent ?? 0}%
              </dd>
            </div>
          </div>
          <div className="flex items-center gap-wilms-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Banknote className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <dt className="text-small text-text-muted">Collected</dt>
              <dd className="text-heading-3 font-semibold text-text-primary">
                <CurrencyAmount value={financial.collectedPesewas ?? 0} />
              </dd>
            </div>
          </div>
        </dl>
      </section>
    </div>
  );
}
