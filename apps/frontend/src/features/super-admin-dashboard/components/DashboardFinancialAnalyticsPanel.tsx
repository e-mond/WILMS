'use client';

import type { ReactNode } from 'react';
import { CurrencyAmount } from '@/components/data-display';
import type {
  DashboardCollectorPerformanceRow,
  DashboardFinancialOverview,
} from '@/types/dashboard';
import { cn } from '@/utils/cn';

export interface DashboardFinancialAnalyticsPanelProps {
  overview: DashboardFinancialOverview;
  collectorPerformance: DashboardCollectorPerformanceRow[];
  chartType?: 'bar' | 'line' | 'area' | 'pie';
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

function formatChartValue(
  value: number,
  format: 'currency' | 'percent' | 'count',
): ReactNode {
  if (format === 'currency') {
    return <CurrencyAmount value={value} className="whitespace-nowrap tabular-nums" />;
  }

  if (format === 'percent') {
    return <span className="whitespace-nowrap tabular-nums">{value}%</span>;
  }

  return <span className="whitespace-nowrap tabular-nums">{value.toLocaleString()}</span>;
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
    <section className="min-w-0 overflow-hidden rounded-sm border border-border bg-background p-wilms-5 sm:p-wilms-6">
      <div className="mb-wilms-5 space-y-wilms-1">
        <h3 className="text-heading-3 font-semibold text-text-primary">{title}</h3>
        {description ? <p className="text-small text-text-muted">{description}</p> : null}
      </div>
      <ul className="space-y-wilms-4" role="list" aria-label={title}>
        {items.map((item) => {
          const widthPercent = Math.max(4, Math.round((item.value / max) * 100));

          return (
            <li key={item.label} className="min-w-0">
              <div className="mb-wilms-1 flex min-w-0 items-center justify-between gap-wilms-2 text-small">
                <span className="min-w-0 truncate font-medium text-text-primary">{item.label}</span>
                <span className="shrink-0 font-semibold text-text-primary">
                  {formatChartValue(item.value, format)}
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

function PieChart({
  title,
  description,
  items,
}: {
  title: string;
  description?: string;
  items: BarChartItem[];
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  let cursor = 0;

  const slices = items.map((item) => {
    const start = cursor;
    const angle = (item.value / total) * 360;
    cursor += angle;
    return { ...item, start, angle };
  });

  return (
    <section className="min-w-0 overflow-hidden rounded-sm border border-border bg-background p-wilms-5 sm:p-wilms-6">
      <div className="mb-wilms-5 space-y-wilms-1">
        <h3 className="text-heading-3 font-semibold text-text-primary">{title}</h3>
        {description ? <p className="text-small text-text-muted">{description}</p> : null}
      </div>
      <div className="flex min-w-0 flex-col gap-wilms-4 sm:flex-row sm:items-center">
        <svg viewBox="0 0 36 36" className="mx-auto h-36 w-36 shrink-0" role="img" aria-label={title}>
          {slices.map((slice) => {
            const radius = 16;
            const circumference = 2 * Math.PI * radius;
            const dash = (slice.angle / 360) * circumference;
            const offset = (slice.start / 360) * circumference;
            return (
              <circle
                key={slice.label}
                r={radius}
                cx="18"
                cy="18"
                fill="transparent"
                strokeWidth="4"
                stroke="currentColor"
                className={cn('text-brand-primary', slice.tone === 'success' && 'text-status-active', slice.tone === 'danger' && 'text-danger', slice.tone === 'gold' && 'text-executive-gold')}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 18 18)"
              />
            );
          })}
        </svg>
        <ul className="min-w-0 flex-1 space-y-wilms-2" role="list">
          {items.map((item) => (
            <li key={item.label} className="flex min-w-0 items-center justify-between gap-wilms-2 text-small">
              <span className="min-w-0 truncate font-medium text-text-primary">{item.label}</span>
              <span className="shrink-0">
                <CurrencyAmount value={item.value} className="whitespace-nowrap tabular-nums" />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function TrendChart({
  title,
  description,
  items,
  chartType,
}: {
  title: string;
  description?: string;
  items: BarChartItem[];
  chartType: 'line' | 'area';
}) {
  const max = Math.max(...items.map((item) => item.value), 1);
  const width = 320;
  const height = 120;
  const points = items.map((item, index) => {
    const x = (index / Math.max(items.length - 1, 1)) * width;
    const y = height - (item.value / max) * height;
    return { x, y, item };
  });
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ');
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  return (
    <section className="min-w-0 overflow-hidden rounded-sm border border-border bg-background p-wilms-5 sm:p-wilms-6">
      <div className="mb-wilms-5 space-y-wilms-1">
        <h3 className="text-heading-3 font-semibold text-text-primary">{title}</h3>
        {description ? <p className="text-small text-text-muted">{description}</p> : null}
      </div>
      <div className="min-w-0 overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-32 w-full max-w-full" preserveAspectRatio="none" role="img" aria-label={title}>
          {chartType === 'area' ? (
            <path d={areaPath} className="fill-brand-primary/20 stroke-none" />
          ) : null}
          <path d={linePath} className="fill-none stroke-brand-primary" strokeWidth="2" />
          {points.map((point) => (
            <circle key={point.item.label} cx={point.x} cy={point.y} r="3" className="fill-brand-primary" />
          ))}
        </svg>
      </div>
      <ul className="mt-wilms-4 grid min-w-0 gap-wilms-2 sm:grid-cols-2" role="list">
        {items.map((item) => (
          <li key={item.label} className="flex min-w-0 items-center justify-between gap-wilms-2 text-small">
            <span className="min-w-0 truncate font-medium text-text-primary">{item.label}</span>
            <span className="shrink-0">
              <CurrencyAmount value={item.value} className="whitespace-nowrap tabular-nums" />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function DashboardFinancialAnalyticsPanel({
  overview,
  collectorPerformance,
  chartType = 'bar',
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
      label: 'Net after expenses',
      value: overview.collections.netCollectionsAfterExpensesPesewas,
      tone: 'gold',
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
      label: 'Net operating cash',
      value: Math.abs(overview.cashFlow.netOperatingCashPesewas),
      tone: overview.cashFlow.netOperatingCashPesewas >= 0 ? 'success' : 'danger',
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

  const renderChart = (title: string, description: string | undefined, items: BarChartItem[], format?: 'currency' | 'percent' | 'count') => {
    if (chartType === 'pie') {
      return <PieChart title={title} description={description} items={items} />;
    }

    if (chartType === 'line' || chartType === 'area') {
      return <TrendChart title={title} description={description} items={items} chartType={chartType} />;
    }

    return (
      <HorizontalBarChart title={title} description={description} items={items} format={format} />
    );
  };

  return (
    <div className="min-w-0 space-y-wilms-6">
      <div className="grid min-w-0 grid-cols-1 gap-wilms-6 xl:grid-cols-2">
        {renderChart('Capital distribution', 'Pool funds and lending capacity', capitalItems)}
        {renderChart(
          'Collections performance',
          `Collection rate ${overview.collections.collectionRatePercent}%`,
          collectionItems,
        )}
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-wilms-6 xl:grid-cols-2">
        {renderChart('Cash flow', 'Organisation money in vs money out', cashFlowItems)}
        {topCollectors.length > 0 ? (
          renderChart(
            'Collector performance',
            'Top collectors by collection rate',
            topCollectors,
            'percent',
          )
        ) : (
          <section className="min-w-0 overflow-hidden rounded-sm border border-border bg-background p-wilms-5 sm:p-wilms-6">
            <h3 className="text-heading-3 font-semibold text-text-primary">Collector performance</h3>
            <p className="mt-wilms-3 text-body text-text-muted">No collector repayments recorded yet.</p>
          </section>
        )}
      </div>

      <section className="min-w-0 overflow-hidden rounded-sm border border-border bg-background p-wilms-5 sm:p-wilms-6">
        <h3 className="text-heading-3 font-semibold text-text-primary">Lending snapshot</h3>
        <dl className="mt-wilms-4 grid min-w-0 grid-cols-1 gap-wilms-4 sm:grid-cols-3">
          <div className="min-w-0">
            <dt className="truncate text-small text-text-muted">Disbursed</dt>
            <dd className="mt-wilms-1 font-semibold text-text-primary">
              <CurrencyAmount value={overview.lending.totalLoanAmountDisbursedPesewas} className="whitespace-nowrap tabular-nums" />
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="truncate text-small text-text-muted">Active loans</dt>
            <dd className="mt-wilms-1 whitespace-nowrap font-semibold tabular-nums text-text-primary">
              {overview.lending.totalActiveLoans.toLocaleString()}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="truncate text-small text-text-muted">Closed loans</dt>
            <dd className="mt-wilms-1 whitespace-nowrap font-semibold tabular-nums text-text-primary">
              {overview.lending.totalClosedLoans.toLocaleString()}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
