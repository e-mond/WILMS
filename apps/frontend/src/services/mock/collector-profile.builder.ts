import { getGroupsDemoSources } from '@/services/mock/factories/groups-demo.factory';
import { getFinancialTransactions } from '@/services/mock/transaction-log.store';
import {
  type CollectorDetail,
  type CollectorProfileActivityEntry,
  type CollectorProfileGroupPerformance,
  type CollectorSummary,
} from '@/types/collector-management';
import { GROUP_RISK_LEVEL, type GroupRiskLevel } from '@/types/group';
import { TRANSACTION_TYPE } from '@/types/transaction';

function parseCollectorIndex(collectorId: string): number {
  const match = collectorId.match(/(\d+)/);
  return match ? Number.parseInt(match[1]!, 10) : 0;
}

function deriveGroupRiskLevel(group: {
  collectionRatePercent: number;
  isManuallySuspended?: boolean;
}): GroupRiskLevel {
  if (group.isManuallySuspended) {
    return GROUP_RISK_LEVEL.SUSPENDED;
  }

  if (group.collectionRatePercent <= 55) {
    return GROUP_RISK_LEVEL.SUSPENDED;
  }

  if (group.collectionRatePercent <= 69) {
    return GROUP_RISK_LEVEL.FLAGGED;
  }

  if (group.collectionRatePercent <= 84) {
    return GROUP_RISK_LEVEL.AT_RISK;
  }

  return GROUP_RISK_LEVEL.LOW_RISK;
}

function mapRiskLevel(rate: number, riskLevel?: GroupRiskLevel): string {
  if (riskLevel === GROUP_RISK_LEVEL.FLAGGED || riskLevel === GROUP_RISK_LEVEL.SUSPENDED) {
    return 'At risk';
  }

  if (riskLevel === GROUP_RISK_LEVEL.AT_RISK || rate < 75) {
    return 'At risk';
  }

  if (rate >= 90) {
    return 'Low';
  }

  return 'Moderate';
}

function mapRepaymentTrend(rate: number): string {
  if (rate >= 90) {
    return 'Improving';
  }

  if (rate >= 75) {
    return 'Stable';
  }

  return 'Declining';
}

function buildAssignedGroups(collector: CollectorSummary): CollectorProfileGroupPerformance[] {
  const collectorIndex = parseCollectorIndex(collector.id);

  return getGroupsDemoSources()
    .filter((_, index) => index % 7 === collectorIndex % 7)
    .slice(0, 4)
    .map((group) => ({
      id: group.id,
      name: group.name,
      memberCount: group.memberCount,
      repaymentTrend: mapRepaymentTrend(group.collectionRatePercent),
      riskLevel: mapRiskLevel(group.collectionRatePercent, deriveGroupRiskLevel(group)),
    }));
}

function buildRecentCollections(collectorId: string): CollectorProfileActivityEntry[] {
  const repayments = getFinancialTransactions().filter(
    (entry) => entry.type === TRANSACTION_TYPE.REPAYMENT && entry.collectorId === collectorId,
  );
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  const todayCount = repayments.filter((entry) => entry.recordedAt.startsWith(today)).length;
  const yesterdayCount = repayments.filter((entry) => entry.recordedAt.startsWith(yesterday)).length;

  const entries: CollectorProfileActivityEntry[] = [];

  if (todayCount > 0) {
    entries.push({
      id: `${collectorId}-today`,
      message: `Today · ${todayCount} payment${todayCount === 1 ? '' : 's'} recorded`,
      tone: 'default',
    });
  }

  if (yesterdayCount > 0) {
    entries.push({
      id: `${collectorId}-yesterday`,
      message: `Yesterday · ${yesterdayCount} payment${yesterdayCount === 1 ? '' : 's'} recorded`,
      tone: 'default',
    });
  }

  if (entries.length === 0 && repayments.length > 0) {
    const latest = repayments[repayments.length - 1]!;
    entries.push({
      id: `${collectorId}-latest`,
      message: `Latest · payment recorded ${latest.recordedAt.slice(0, 10)}`,
      tone: 'default',
    });
  }

  return entries;
}

function buildFlagsRaised(groups: CollectorProfileGroupPerformance[]): CollectorProfileActivityEntry[] {
  return groups
    .filter((group) => group.riskLevel === 'At risk')
    .slice(0, 2)
    .map((group) => ({
      id: `flag-${group.id}`,
      message: `Group arrears · ${group.name}`,
      tone: 'danger' as const,
    }));
}

function buildActivityHistory(collector: CollectorSummary): CollectorProfileActivityEntry[] {
  const entries: CollectorProfileActivityEntry[] = [];

  if (collector.expensesSubmittedCount > 0) {
    entries.push({
      id: `${collector.id}-expense`,
      message: `Expense submitted · ${collector.expensesSubmittedCount} this cycle`,
      tone: 'muted',
    });
  }

  if (collector.reconciliationCount > 0) {
    entries.push({
      id: `${collector.id}-reconcile`,
      message: `Reconciliation submitted · ${collector.reconciliationCount} total`,
      tone: 'muted',
    });
  }

  return entries;
}

export function assembleCollectorProfileDetail(collector: CollectorSummary): CollectorDetail {
  const assignedGroups = buildAssignedGroups(collector);

  return {
    ...collector,
    monthlyPerformance: collector.monthlyPerformance,
    assignedGroups,
    recentCollections: buildRecentCollections(collector.id),
    flagsRaised: buildFlagsRaised(assignedGroups),
    activityHistory: buildActivityHistory(collector),
  };
}
