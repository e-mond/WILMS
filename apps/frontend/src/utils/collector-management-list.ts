import { COLLECTOR_EXPECTED_PESEWAS_FALLBACK, COLLECTOR_ZONE_OPTIONS } from '@/constants/collectors-reference-scale';
import { DEMO_ACCOUNTS } from '@/constants/demo-accounts';
import { USER_ROLE } from '@/constants/roles';
import {
  COLLECTOR_STATUS,
  type CollectorAlert,
  type CollectorListResponse,
  type CollectorSummary,
} from '@/types/collector-management';
import { TRANSACTION_TYPE, type FinancialTransaction } from '@/types/transaction';
import { rollingSixMonthLabels } from '@/utils/collector-trend';

export function buildCollectorSummaries(
  transactions: readonly FinancialTransaction[],
): CollectorSummary[] {
  const collectors = DEMO_ACCOUNTS.filter((account) => account.role === USER_ROLE.COLLECTOR);

  return collectors.map((collector, index) => {
    const repayments = transactions.filter(
      (transaction) =>
        transaction.type === TRANSACTION_TYPE.REPAYMENT &&
        transaction.collectorId === collector.id,
    );
    const collectedPesewas = repayments.reduce(
      (total, transaction) => total + transaction.amountPesewas,
      0,
    );
    const expectedPesewas =
      collectedPesewas > 0 ? collectedPesewas : COLLECTOR_EXPECTED_PESEWAS_FALLBACK;
    const collectionRatePercent =
      expectedPesewas === 0
        ? 0
        : Math.round((collectedPesewas / expectedPesewas) * 1000) / 10;

    const rate = Math.min(collectionRatePercent, 100);
    const monthLabels = rollingSixMonthLabels();
    const offsets = [12, 9, 7, 5, 2, 0];
    const monthlyPerformance = monthLabels.map((monthLabel, monthIndex) => ({
      monthLabel,
      collectionRatePercent: Math.max(rate - offsets[monthIndex]!, 0),
    }));

    return {
      id: collector.id,
      displayName: collector.displayName,
      zone: COLLECTOR_ZONE_OPTIONS[index % COLLECTOR_ZONE_OPTIONS.length] ?? COLLECTOR_ZONE_OPTIONS[0],
      groupCount: index === 0 ? 12 : 8,
      borrowerCount: index === 0 ? 204 : 142,
      expectedPesewas,
      collectedPesewas,
      collectionRatePercent: rate,
      recoveryRatePercent: Math.min(100, rate + 3),
      reconciliationCount: Math.max(1, index + 4),
      expensesSubmittedCount: index === 0 ? 9 : 6,
      status: COLLECTOR_STATUS.ACTIVE,
      streakWeeks: index === 0 ? 5 : 2,
      trendDirection: index === 0 ? 'up' : 'neutral',
      cycleLabel: 'Current cycle',
      joinedAt: '2022-02-01',
      lastActiveAt: new Date().toISOString(),
      rateTrend: monthlyPerformance.map((entry) => entry.collectionRatePercent),
      monthlyPerformance,
    };
  });
}

export function buildCollectorListResponse(
  collectors: CollectorSummary[],
  alerts: CollectorAlert[] = [],
): CollectorListResponse {
  const avgCollectionRatePercent =
    collectors.length === 0
      ? 0
      : Math.round(
          (collectors.reduce((total, collector) => total + collector.collectionRatePercent, 0) /
            collectors.length) *
            10,
        ) / 10;

  const belowSeventyPercent = collectors.filter(
    (collector) => collector.collectionRatePercent < 70,
  ).length;

  const rateDistribution = collectors.reduce(
    (counts, collector) => {
      if (collector.collectionRatePercent >= 90) {
        counts.topPerformers += 1;
      } else if (collector.collectionRatePercent >= 70) {
        counts.onTrack += 1;
      } else {
        counts.needsAttention += 1;
      }

      return counts;
    },
    { topPerformers: 0, onTrack: 0, needsAttention: 0 },
  );

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalCollectors: collectors.length,
      avgCollectionRatePercent,
      belowSeventyPercent,
      activeToday: collectors.filter((collector) => collector.status === COLLECTOR_STATUS.ACTIVE)
        .length,
    },
    rateDistribution,
    collectors,
    alerts,
  };
}
