import {
  buildAlertsFromMissed,
  buildCollectorDashboardCore,
  buildHeroFromSummary,
  buildRecentPaymentsFromBorrowers,
  buildStatsFromSummary,
  type BuildCollectorDashboardInput,
  type CollectorDashboardCore,
} from '@/features/payment-collection/collector-dashboard.utils';
import { buildCollectionMetrics } from '@/services/mock/collection-metrics.builder';
import { getCollectorsDemoDataset } from '@/services/mock/factories/collectors-demo.factory';
import { getGroupsDemoSources } from '@/services/mock/factories/groups-demo.factory';
import { getFinancialTransactions } from '@/services/mock/transaction-log.store';
import {
  COLLECTION_PERIOD,
  COLLECTION_SCOPE,
} from '@/types/collection-metrics';
import type {
  CollectorDashboard,
  CollectorDashboardAlert,
  CollectorTodayGroup,
} from '@/types/collector-dashboard';
import { COLLECTOR_PAYMENT_STATUS } from '@/types/collector-dashboard';
import { TRANSACTION_TYPE } from '@/types/transaction';
import { resolvePersonPhotoUrl } from '@/utils/person-photo';

function resolveCollectorMetric(
  collectorId: string,
  referenceDate: string,
  period: (typeof COLLECTION_PERIOD)[keyof typeof COLLECTION_PERIOD],
) {
  const response = buildCollectionMetrics({
    period,
    scope: COLLECTION_SCOPE.COLLECTOR,
    scopeId: collectorId,
    referenceDate,
  });

  return (
    response.metrics.find(
      (metric) => metric.scope === COLLECTION_SCOPE.COLLECTOR && metric.scopeId === collectorId,
    ) ?? response.organisationTotal
  );
}

function computeWeeklyTrendPercent(collectorId: string, referenceDate: string): number {
  const currentWeek = resolveCollectorMetric(
    collectorId,
    referenceDate,
    COLLECTION_PERIOD.WEEKLY,
  );
  const previousReference = new Date(referenceDate);
  previousReference.setDate(previousReference.getDate() - 7);
  const previousWeek = resolveCollectorMetric(
    collectorId,
    previousReference.toISOString(),
    COLLECTION_PERIOD.WEEKLY,
  );

  if (previousWeek.collectedPesewas <= 0) {
    return currentWeek.collectedPesewas > 0 ? 100 : 0;
  }

  return Math.round(
    ((currentWeek.collectedPesewas - previousWeek.collectedPesewas) / previousWeek.collectedPesewas) *
      100,
  );
}

function computeCollectionStreakDays(collectorId: string, referenceDate: string): number {
  const transactions = getFinancialTransactions().filter(
    (transaction) =>
      transaction.type === TRANSACTION_TYPE.REPAYMENT && transaction.collectorId === collectorId,
  );

  let streak = 0;
  const cursor = new Date(referenceDate);

  while (streak < 30) {
    const dayKey = cursor.toISOString().slice(0, 10);
    const hasCollection = transactions.some((transaction) =>
      transaction.recordedAt.startsWith(dayKey),
    );

    if (!hasCollection) {
      break;
    }

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function resolveAssignedGroups(collectorId: string) {
  const collector = getCollectorsDemoDataset().collectors.find((entry) => entry.id === collectorId);
  const groupLimit = Math.max(collector?.groupCount ?? 4, 1);

  return getGroupsDemoSources().slice(0, groupLimit);
}

function buildTodayGroups(
  core: CollectorDashboardCore,
  assignedGroups: ReturnType<typeof getGroupsDemoSources>,
): CollectorTodayGroup[] {
  return assignedGroups.map((group) => {
    const groupBorrowers = core.borrowers.filter((borrower) => borrower.groupName === group.name);
    const fallbackExpectedCount = Math.max(
      Math.round(group.activeMemberCount / 5),
      groupBorrowers.length,
      1,
    );
    const expectedCount = groupBorrowers.length > 0 ? groupBorrowers.length : fallbackExpectedCount;
    const collectedCount = groupBorrowers.filter(
      (borrower) => borrower.collectedPesewas >= borrower.expectedPesewas,
    ).length;
    const pendingCount = groupBorrowers.filter(
      (borrower) => borrower.paymentStatus === COLLECTOR_PAYMENT_STATUS.PENDING,
    ).length;
    const expectedPesewas =
      groupBorrowers.length > 0
        ? groupBorrowers.reduce((total, borrower) => total + borrower.expectedPesewas, 0)
        : Math.round((group.disbursedPesewas - group.collectedPesewas) / 100);
    const amountCollectedPesewas = groupBorrowers.reduce(
      (total, borrower) => total + borrower.collectedPesewas,
      0,
    );
    const progressPercent =
      expectedCount === 0 ? 0 : Math.round((collectedCount / expectedCount) * 100);

    return {
      groupId: group.id,
      groupName: group.name,
      community: group.community,
      leaderName: group.leaderName,
      groupPhotoUrl: resolvePersonPhotoUrl({ name: group.name, id: group.id }),
      collectedCount,
      expectedCount,
      pendingCount,
      expectedPesewas,
      amountCollectedPesewas,
      progressPercent,
      status: progressPercent >= 100 ? 'Complete' : pendingCount > 0 ? 'In progress' : 'Pending',
    };
  });
}

function buildGroupArrearsAlerts(
  assignedGroups: ReturnType<typeof getGroupsDemoSources>,
): CollectorDashboardAlert[] {
  return assignedGroups
    .filter((group) => group.collectionRatePercent < 75)
    .slice(0, 2)
    .map((group) => ({
      id: `group-arrears-${group.id}`,
      message: `${group.name} collection rate at ${group.collectionRatePercent}%`,
      tone: 'warning' as const,
    }));
}

export function assembleCollectorDashboard(input: BuildCollectorDashboardInput): CollectorDashboard {
  const core = buildCollectorDashboardCore(input);
  const assignedGroups = resolveAssignedGroups(input.collectorId);
  const todayGroups = buildTodayGroups(core, assignedGroups);

  const hero = {
    ...buildHeroFromSummary(core.summary),
    targetPesewas: core.summary.expectedPesewas,
    progressPercent: core.summary.collectionRatePercent,
    groupsToday: todayGroups.length,
    streakDays: computeCollectionStreakDays(input.collectorId, input.referenceDate),
    weeklyTrendPercent: computeWeeklyTrendPercent(input.collectorId, input.referenceDate),
  };

  const alerts = [...buildAlertsFromMissed(core.missedAlerts), ...buildGroupArrearsAlerts(assignedGroups)];

  return {
    ...core,
    hero,
    alerts,
    todayGroups,
    recentPayments: buildRecentPaymentsFromBorrowers(core.borrowers, input),
    stats: buildStatsFromSummary(core.summary, input.loans.length, todayGroups.length),
  };
}
