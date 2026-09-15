'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight } from 'lucide-react';
import { CurrencyAmount, Sparkline } from '@/components/data-display';
import { Skeleton } from '@/components/feedback/Skeleton';
import { DetailSidebarCard } from '@/components/layout/executive';
import { intelligenceService } from '@/services/intelligenceService';
import type { ExecutiveDashboard } from '@/types/intelligence';
import { cn } from '@/utils/cn';

export interface ExecutiveAsidePanelProps {
  dashboard: ExecutiveDashboard;
}

function ParHistogram({ dashboard }: { dashboard: ExecutiveDashboard }) {
  const risk = dashboard.risk ?? {};
  const bands = [
    {
      id: 'par30',
      label: '30d',
      count: risk.par30Count ?? 0,
      rate: risk.par30RatePercent ?? 0,
      barClass: 'bg-status-at-risk',
    },
    {
      id: 'par60',
      label: '60d',
      count: risk.par60Count ?? 0,
      rate: risk.par60RatePercent ?? 0,
      barClass: 'bg-warning',
    },
    {
      id: 'par90',
      label: '90d',
      count: risk.par90Count ?? 0,
      rate: risk.par90RatePercent ?? 0,
      barClass: 'bg-danger',
    },
  ] as const;

  const maxCount = Math.max(...bands.map((band) => band.count), 1);

  return (
    <DetailSidebarCard title="PAR histogram" subtitle="Loan counts by delinquency band">
      <div
        className="mt-wilms-4 flex h-28 items-end gap-2.5"
        role="img"
        aria-label="PAR delinquency histogram"
      >
        {bands.map((band) => {
          const heightPercent = Math.max(8, Math.round((band.count / maxCount) * 100));
          return (
            <div key={band.id} className="flex h-full flex-1 flex-col justify-end gap-1.5">
              <span className="text-center text-[10px] font-semibold tabular-nums text-text-primary">
                {band.count}
              </span>
              <div
                className={cn('mx-auto w-full max-w-[2.5rem] rounded-t-md', band.barClass)}
                style={{ height: `${heightPercent}%` }}
                title={`${band.label}: ${band.count} loans (${band.rate}%)`}
              />
              <span className="text-center text-[10px] font-semibold text-text-muted">
                {band.label}
              </span>
            </div>
          );
        })}
      </div>
      <Link
        href="/reports/aging-analysis"
        className="mt-wilms-3 inline-flex items-center gap-1 text-small font-semibold text-brand-primary hover:underline"
      >
        Aging analysis
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </DetailSidebarCard>
  );
}

function ForecastTrendCard() {
  const forecastQuery = useQuery({
    queryKey: ['intelligence', 'forecast', 28] as const,
    queryFn: () => intelligenceService.getForecast(28),
  });

  return (
    <DetailSidebarCard title="Collection forecast" subtitle="Expected vs projected (4 weeks)">
      {forecastQuery.isLoading ? (
        <div className="mt-wilms-3 space-y-2" aria-busy="true">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-3 w-28" />
        </div>
      ) : null}

      {forecastQuery.isError ? (
        <div className="mt-wilms-3 rounded-lg border border-danger/30 bg-danger/5 px-3 py-3" role="alert">
          <p className="text-small font-medium text-text-primary">Unable to load forecast</p>
          <button
            type="button"
            className="mt-2 text-small font-semibold text-brand-primary hover:underline"
            onClick={() => void forecastQuery.refetch()}
          >
            Retry
          </button>
        </div>
      ) : null}

      {forecastQuery.data ? (
        <div className="mt-wilms-3 space-y-wilms-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] text-text-muted">Projected collections</p>
              <p className="text-body font-semibold text-text-primary">
                <CurrencyAmount
                  value={forecastQuery.data.summary.projectedCollectionsPesewas ?? 0}
                />
              </p>
            </div>
            <Sparkline
              values={forecastQuery.data.series.map((point) => point.projectedPesewas)}
              width={88}
              height={28}
              strokeClassName="stroke-brand-primary"
            />
          </div>

          <div
            className="flex h-16 items-end gap-1"
            role="img"
            aria-label="Weekly projected collection bars"
          >
            {forecastQuery.data.series.map((point, index) => {
              const peak = Math.max(
                ...forecastQuery.data.series.map((entry) => entry.projectedPesewas),
                1,
              );
              const heightPercent = Math.max(
                8,
                Math.round((point.projectedPesewas / peak) * 100),
              );
              const isLatest = index === forecastQuery.data.series.length - 1;
              return (
                <div key={point.weekStarting} className="flex h-full flex-1 flex-col justify-end">
                  <div
                    className={cn(
                      'w-full rounded-t-sm',
                      isLatest ? 'bg-brand-primary' : 'bg-brand-primary/30',
                    )}
                    style={{ height: `${heightPercent}%` }}
                    title={`Week of ${point.weekStarting}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </DetailSidebarCard>
  );
}

function PortfolioCompositionCard({ dashboard }: { dashboard: ExecutiveDashboard }) {
  const financial = dashboard.financial ?? {};
  const collected = financial.collectedPesewas ?? 0;
  const outstanding = financial.outstandingPesewas ?? 0;
  const writeOffs = financial.writeOffsPesewas ?? 0;
  const total = Math.max(collected + outstanding + writeOffs, 1);

  const slices = [
    { id: 'collected', label: 'Collected', value: collected, barClass: 'bg-status-active' },
    { id: 'outstanding', label: 'Outstanding', value: outstanding, barClass: 'bg-brand-primary' },
    { id: 'writeoffs', label: 'Write-offs', value: writeOffs, barClass: 'bg-danger' },
  ] as const;

  return (
    <DetailSidebarCard title="Book composition" subtitle="Share of portfolio value">
      <div
        className="mt-wilms-4 flex h-3 overflow-hidden rounded-full bg-border"
        role="img"
        aria-label="Portfolio composition"
      >
        {slices.map((slice) => {
          const widthPercent = Math.max(slice.value > 0 ? 4 : 0, Math.round((slice.value / total) * 100));
          if (widthPercent === 0) {
            return null;
          }
          return (
            <div
              key={slice.id}
              className={cn('h-full', slice.barClass)}
              style={{ width: `${widthPercent}%` }}
              title={`${slice.label}: ${(slice.value / 100).toLocaleString('en-GH', {
                style: 'currency',
                currency: 'GHS',
                maximumFractionDigits: 0,
              })}`}
            />
          );
        })}
      </div>
      <ul className="mt-wilms-3 space-y-wilms-2 text-small">
        {slices.map((slice) => (
          <li key={slice.id} className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-text-muted">
              <span className={cn('h-2 w-2 rounded-full', slice.barClass)} aria-hidden="true" />
              {slice.label}
            </span>
            <span className="font-semibold tabular-nums text-text-primary">
              <CurrencyAmount value={slice.value} className="text-small" />
            </span>
          </li>
        ))}
      </ul>
    </DetailSidebarCard>
  );
}

function CommunityBreakdownCard() {
  const breakdownQuery = useQuery({
    queryKey: ['intelligence', 'portfolio-breakdown'] as const,
    queryFn: () => intelligenceService.getPortfolioBreakdown(),
  });

  const communities = (breakdownQuery.data?.byCommunity ?? [])
    .slice()
    .sort((a, b) => (b.members ?? 0) - (a.members ?? 0))
    .slice(0, 5);
  const maxMembers = Math.max(...communities.map((entry) => entry.members ?? 0), 1);

  return (
    <DetailSidebarCard title="Top communities" subtitle="Members by community">
      {breakdownQuery.isLoading ? (
        <div className="mt-wilms-3 space-y-2" aria-busy="true">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : null}

      {breakdownQuery.isError ? (
        <p className="mt-wilms-3 text-small text-text-muted">Community breakdown unavailable.</p>
      ) : null}

      {communities.length > 0 ? (
        <ul className="mt-wilms-3 space-y-wilms-2" aria-label="Community member histogram">
          {communities.map((entry) => {
            const widthPercent = Math.max(
              8,
              Math.round(((entry.members ?? 0) / maxMembers) * 100),
            );
            return (
              <li key={entry.community}>
                <div className="mb-1 flex items-center justify-between gap-2 text-small">
                  <span className="truncate text-text-muted">{entry.community}</span>
                  <span className="shrink-0 font-semibold tabular-nums text-text-primary">
                    {entry.members ?? 0}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-background">
                  <div
                    className="h-1.5 rounded-full bg-brand-primary/70"
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {!breakdownQuery.isLoading && !breakdownQuery.isError && communities.length === 0 ? (
        <p className="mt-wilms-3 text-small text-text-muted">No community data yet.</p>
      ) : null}
    </DetailSidebarCard>
  );
}

export function ExecutiveAsidePanel({ dashboard }: ExecutiveAsidePanelProps) {
  return (
    <div className="flex h-full flex-col space-y-wilms-4">
      <ParHistogram dashboard={dashboard} />
      <ForecastTrendCard />
      <PortfolioCompositionCard dashboard={dashboard} />
      <CommunityBreakdownCard />
    </div>
  );
}
