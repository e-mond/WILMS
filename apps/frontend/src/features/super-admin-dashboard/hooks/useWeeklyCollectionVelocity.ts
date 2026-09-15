'use client';

import { useQuery } from '@tanstack/react-query';
import { collectionMetricsService } from '@/services';
import { COLLECTION_PERIOD } from '@/types/collection-metrics';

export interface WeeklyVelocityDay {
  date: string;
  label: string;
  collectedPesewas: number;
  expectedPesewas: number;
  collectionRatePercent: number;
}

export interface WeeklyVelocitySnapshot {
  days: WeeklyVelocityDay[];
  weekTotalPesewas: number;
  priorHalfPesewas: number;
  recentHalfPesewas: number;
  trendPercent: number;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dayLabel(isoDate: string, index: number, total: number): string {
  if (index === total - 1) return 'Today';
  const date = new Date(`${isoDate}T12:00:00.000Z`);
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(date);
}

export function useWeeklyCollectionVelocity() {
  return useQuery({
    queryKey: ['collection-metrics', 'weekly-velocity'] as const,
    queryFn: async (): Promise<WeeklyVelocitySnapshot> => {
      const today = new Date();
      const days = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() - (6 - index));
        return toIsoDate(date);
      });

      const snapshots = await Promise.all(
        days.map((referenceDate) =>
          collectionMetricsService.getMetrics({
            period: COLLECTION_PERIOD.DAILY,
            referenceDate,
          }),
        ),
      );

      const mappedDays: WeeklyVelocityDay[] = days.map((date, index) => {
        const total = snapshots[index]?.organisationTotal;
        return {
          date,
          label: dayLabel(date, index, days.length),
          collectedPesewas: total?.collectedPesewas ?? 0,
          expectedPesewas: total?.expectedPesewas ?? 0,
          collectionRatePercent: total?.collectionRatePercent ?? 0,
        };
      });

      const priorHalfPesewas = mappedDays
        .slice(0, 3)
        .reduce((sum, day) => sum + day.collectedPesewas, 0);
      const recentHalfPesewas = mappedDays
        .slice(4)
        .reduce((sum, day) => sum + day.collectedPesewas, 0);
      const weekTotalPesewas = mappedDays.reduce(
        (sum, day) => sum + day.collectedPesewas,
        0,
      );

      const trendPercent =
        priorHalfPesewas === 0
          ? recentHalfPesewas > 0
            ? 100
            : 0
          : Math.round(((recentHalfPesewas - priorHalfPesewas) / priorHalfPesewas) * 1000) / 10;

      return {
        days: mappedDays,
        weekTotalPesewas,
        priorHalfPesewas,
        recentHalfPesewas,
        trendPercent,
      };
    },
    staleTime: 60_000,
  });
}
