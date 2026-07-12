'use client';

import { CurrencyAmount, KpiCard } from '@/components/data-display';
import { ExecutiveKpiGrid } from '@/components/layout/executive';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { useQueryLoadingPolicy } from '@/hooks/useQueryLoadingPolicy';
import { useCollectionMetrics } from '@/features/analytics/hooks/useCollectionMetrics';
import { COLLECTION_PERIOD } from '@/types/collection-metrics';
import {
  CurrencyStatValue,
  DashboardFinancialStat,
  DashboardFinancialStatGrid,
  formatCollectionDetail,
} from '@/features/super-admin-dashboard/components/DashboardFinancialStat';

export interface DashboardCollectionSummaryProps {
  compact?: boolean;
}

export function DashboardCollectionSummary({ compact = false }: DashboardCollectionSummaryProps) {
  const daily = useCollectionMetrics({ period: COLLECTION_PERIOD.DAILY });
  const weekly = useCollectionMetrics({ period: COLLECTION_PERIOD.WEEKLY });
  const monthly = useCollectionMetrics({ period: COLLECTION_PERIOD.MONTHLY });

  const isLoading = daily.isLoading || weekly.isLoading || monthly.isLoading;
  const { showLoading, isTimedOut } = useQueryLoadingPolicy({ isLoading });

  if (isTimedOut && isLoading) {
    return (
      <QueryStatePanel
        isLoading
        isTimedOut
        isError={false}
        onRetry={() => {
          void daily.refetch();
          void weekly.refetch();
          void monthly.refetch();
        }}
        variant="inline"
      >
        {null}
      </QueryStatePanel>
    );
  }

  if (showLoading && isLoading) {
    return (
      <QueryStatePanel isLoading showLoading isError={false} variant="inline">
        {null}
      </QueryStatePanel>
    );
  }

  const periods = [
    { label: 'Daily Collections', data: daily.data?.organisationTotal },
    { label: 'Weekly Collections', data: weekly.data?.organisationTotal },
    { label: 'Monthly Collections', data: monthly.data?.organisationTotal },
  ];

  if (compact) {
    return (
      <section className="space-y-wilms-4">
        <div>
          <h3 className="text-heading-3 font-semibold text-text-primary">Collection Performance</h3>
          <p className="mt-wilms-1 text-small text-text-muted">Expected vs collected totals by period</p>
        </div>
        <DashboardFinancialStatGrid>
          {periods.map((period) => (
            <DashboardFinancialStat
              key={period.label}
              label={period.label}
              value={
                period.data ? <CurrencyStatValue pesewas={period.data.collectedPesewas} /> : '—'
              }
              detail={
                period.data
                  ? formatCollectionDetail(
                      period.data.collectedPesewas,
                      period.data.expectedPesewas,
                      period.data.collectionRatePercent,
                    )
                  : undefined
              }
              tone={
                period.data && period.data.collectionRatePercent >= 95
                  ? 'success'
                  : period.data && period.data.collectionRatePercent < 70
                    ? 'danger'
                    : 'default'
              }
            />
          ))}
        </DashboardFinancialStatGrid>
      </section>
    );
  }

  return (
    <section className="space-y-wilms-3">
      <h2 className="text-heading-2 font-semibold text-text-primary">Collection Performance</h2>
      <ExecutiveKpiGrid className="sm:grid-cols-2 xl:grid-cols-3">
        {periods.map((period) => (
          <KpiCard
            key={period.label}
            variant="executive"
            label={period.label}
            value={
              period.data ? (
                <CurrencyAmount value={period.data.collectedPesewas} />
              ) : (
                '—'
              )
            }
            trend={
              period.data
                ? formatCollectionDetail(
                    period.data.collectedPesewas,
                    period.data.expectedPesewas,
                    period.data.collectionRatePercent,
                  )
                : undefined
            }
            trendDirection={
              period.data && period.data.collectionRatePercent >= 95
                ? 'up'
                : period.data && period.data.collectionRatePercent >= 70
                  ? 'neutral'
                  : 'down'
            }
          />
        ))}
      </ExecutiveKpiGrid>
    </section>
  );
}
