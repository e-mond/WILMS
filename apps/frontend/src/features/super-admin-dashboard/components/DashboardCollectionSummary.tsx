'use client';

import { CurrencyAmount, KpiCard } from '@/components/data-display';
import { ExecutiveKpiGrid } from '@/components/layout/executive';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { useCollectionMetrics } from '@/features/analytics/hooks/useCollectionMetrics';
import { COLLECTION_PERIOD } from '@/types/collection-metrics';

export interface DashboardCollectionSummaryProps {
  compact?: boolean;
}

export function DashboardCollectionSummary({ compact = false }: DashboardCollectionSummaryProps) {
  const daily = useCollectionMetrics({ period: COLLECTION_PERIOD.DAILY });
  const weekly = useCollectionMetrics({ period: COLLECTION_PERIOD.WEEKLY });
  const monthly = useCollectionMetrics({ period: COLLECTION_PERIOD.MONTHLY });

  if (daily.isLoading || weekly.isLoading || monthly.isLoading) {
    return <LoadingSpinner label="Loading collection metrics" className="py-wilms-4" />;
  }

  const periods = [
    { label: 'Daily Collections', data: daily.data?.organisationTotal },
    { label: 'Weekly Collections', data: weekly.data?.organisationTotal },
    { label: 'Monthly Collections', data: monthly.data?.organisationTotal },
  ];

  return (
    <section className="space-y-wilms-3">
      <h2 className="text-heading-2 font-semibold text-text-primary">Collection Performance</h2>
      <ExecutiveKpiGrid
        className={
          compact ? 'grid-cols-1 sm:grid-cols-2' : 'sm:grid-cols-2 xl:grid-cols-3'
        }
      >
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
                ? `${period.data.collectionRatePercent}% of ${(
                    period.data.expectedPesewas / 100
                  ).toLocaleString(undefined, { minimumFractionDigits: 2 })} expected`
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
