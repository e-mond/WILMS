'use client';

import { CurrencyAmount } from '@/components/data-display';
import type {
  DashboardCollectorPerformanceRow,
  DashboardFinancialOverview,
} from '@/types/dashboard';
import { cn } from '@/utils/cn';

export interface DashboardFinancialAnalyticsPanelProps {
  overview: DashboardFinancialOverview;
  collectorPerformance: DashboardCollectorPerformanceRow[];
}

interface BarChartItem {
  label: string;
  value: number;
  tone?: 'brand' | 'success' | 'danger' | 'gold';
}

function toneClass(tone: BarChartItem['tone'] = 'brand'): string {
  switch (tone) {
    case 'success':
      return 'bg-status-active';
    case 'danger':
      return 'bg-danger';
    case 'gold':
      return 'bg-executive-gold';
    default:
      return 'bg-brand-primary';
  }
}

function HorizontalBarChart({
  title,
  description,
  items,
  format = 'currency',
}: {
  title: string;
  description?: string;
  items: BarChartItem[];
  format?: 'currency' | 'percent' | 'count';
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <section className="rounded-sm border border-border bg-background p-wilms-5 sm:p-wilms-6">
      <div className="mb-wilms-5 space-y-wilms-1">
        <h3 className="text-heading-3 font-semibold text-text-primary">{title}</h3>
        {description ? <p className="text-small text-text-muted">{description}</p> : null}
      </div>
      <ul className="space-y-wilms-4" role="list" aria-label={title}>
        {items.map((item) => {
          const widthPercent = Math.max(4, Math.round((item.value / max) * 100));

          return (
            <li key={item.label}>
              <div className="mb-wilms-1 flex items-center justify-between gap-wilms-2 text-small">
                <span className="font-medium text-text-primary">{item.label}</span>
                <span className="font-semibold text-text-primary">
                  {format === 'currency' ? (
                    <CurrencyAmount value={item.value} />
                  ) : format === 'percent' ? (
                    `${item.value}%`
                  ) : (
                    item.value.toLocaleString()
                  )}
                </span>
              </div>
              <div
                className="h-3 overflow-hidden rounded-full bg-border"
                role="img"
                aria-label={`${item.label}: ${format === 'percent' ? `${item.value}%` : item.value}`}
              >
                <div
                  className={cn('h-full rounded-full transition-[width] duration-500', toneClass(item.tone))}
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function DashboardFinancialAnalyticsPanel({
  overview,
  collectorPerformance,
}: DashboardFinancialAnalyticsPanelProps) {
  const capitalItems: BarChartItem[] = [
    {
      label: 'Capital available',
      value: overview.capital.totalCapitalAvailablePesewas,
      tone: 'gold',
    },
    {
      label: 'Capital injected',
      value: overview.capital.totalCapitalInjectedPesewas,
      tone: 'brand',
    },
    {
      label: 'Available balance',
      value: overview.capital.currentAvailableBalancePesewas,
      tone: 'success',
    },
  ];

  const collectionItems: BarChartItem[] = [
    {
      label: 'Collected',
      value: overview.collections.totalAmountCollectedPesewas,
      tone: 'success',
    },
    {
      label: 'Outstanding',
      value: overview.collections.outstandingBalancePesewas,
      tone: 'danger',
    },
    {
      label: 'Overdue',
      value: overview.collections.overdueAmountPesewas,
      tone: 'danger',
    },
    {
      label: 'Due this week',
      value: overview.collections.amountDueThisWeekPesewas,
      tone: 'gold',
    },
  ];

  const cashFlowItems: BarChartItem[] = [
    { label: 'Money in', value: overview.cashFlow.moneyIn.totalPesewas, tone: 'success' },
    { label: 'Money out', value: overview.cashFlow.moneyOut.totalPesewas, tone: 'danger' },
    {
      label: 'Net position',
      value: Math.abs(overview.cashFlow.netPositionPesewas),
      tone: overview.cashFlow.netPositionPesewas >= 0 ? 'success' : 'danger',
    },
  ];

  const topCollectors = [...collectorPerformance]
    .sort((left, right) => right.collectionRatePercent - left.collectionRatePercent)
    .slice(0, 5)
    .map((row) => ({
      label: row.name,
      value: row.collectionRatePercent,
      tone: (row.collectionRatePercent >= 95
        ? 'success'
        : row.collectionRatePercent < 70
          ? 'danger'
          : 'gold') as BarChartItem['tone'],
    }));

  return (
    <div className="space-y-wilms-6">
      <div className="grid grid-cols-1 gap-wilms-6 xl:grid-cols-2">
        <HorizontalBarChart
          title="Capital distribution"
          description="Pool funds and lending capacity"
          items={capitalItems}
        />
        <HorizontalBarChart
          title="Collections performance"
          description={`Collection rate ${overview.collections.collectionRatePercent}%`}
          items={collectionItems}
        />
      </div>

      <div className="grid grid-cols-1 gap-wilms-6 xl:grid-cols-2">
        <HorizontalBarChart
          title="Cash flow"
          description="Organisation money in vs money out"
          items={cashFlowItems}
        />
        {topCollectors.length > 0 ? (
          <HorizontalBarChart
            title="Collector performance"
            description="Top collectors by collection rate"
            items={topCollectors}
            format="percent"
          />
        ) : (
          <section className="rounded-sm border border-border bg-background p-wilms-5 sm:p-wilms-6">
            <h3 className="text-heading-3 font-semibold text-text-primary">Collector performance</h3>
            <p className="mt-wilms-3 text-body text-text-muted">No collector repayments recorded yet.</p>
          </section>
        )}
      </div>

      <section className="rounded-sm border border-border bg-background p-wilms-5 sm:p-wilms-6">
        <h3 className="text-heading-3 font-semibold text-text-primary">Lending snapshot</h3>
        <dl className="mt-wilms-4 grid grid-cols-1 gap-wilms-4 sm:grid-cols-3">
          <div>
            <dt className="text-small text-text-muted">Disbursed</dt>
            <dd className="mt-wilms-1 font-semibold text-text-primary">
              <CurrencyAmount value={overview.lending.totalLoanAmountDisbursedPesewas} />
            </dd>
          </div>
          <div>
            <dt className="text-small text-text-muted">Active loans</dt>
            <dd className="mt-wilms-1 font-semibold text-text-primary">
              {overview.lending.totalActiveLoans.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-small text-text-muted">Closed loans</dt>
            <dd className="mt-wilms-1 font-semibold text-text-primary">
              {overview.lending.totalClosedLoans.toLocaleString()}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
