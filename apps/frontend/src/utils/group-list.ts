import { GROUP_RISK_LEVEL, type GroupListResponse, type GroupSourceRecord, type GroupSummary } from '@/types/group';
import { buildGroupSummaries } from '@/utils/group-profile';

export function buildGroupListResponse(sources: GroupSourceRecord[]): GroupListResponse {
  return buildGroupListResponseFromSummaries(buildGroupSummaries(sources));
}

export function buildGroupListResponseFromSummaries(groups: GroupSummary[]): GroupListResponse {
  const flaggedOrSuspended = groups.filter(
    (group) =>
      group.riskLevel === GROUP_RISK_LEVEL.FLAGGED ||
      group.riskLevel === GROUP_RISK_LEVEL.SUSPENDED,
  ).length;

  const avgCollectionRatePercent =
    groups.length === 0
      ? 0
      : Math.round(
          (groups.reduce((total, group) => total + group.collectionRatePercent, 0) / groups.length) *
            10,
        ) / 10;

  const riskDistribution = groups.reduce(
    (counts, group) => {
      switch (group.riskLevel) {
        case GROUP_RISK_LEVEL.LOW_RISK:
          counts.lowRisk += 1;
          break;
        case GROUP_RISK_LEVEL.AT_RISK:
          counts.atRisk += 1;
          break;
        case GROUP_RISK_LEVEL.FLAGGED:
          counts.flagged += 1;
          break;
        case GROUP_RISK_LEVEL.SUSPENDED:
          counts.suspended += 1;
          break;
        default:
          break;
      }

      return counts;
    },
    { lowRisk: 0, atRisk: 0, flagged: 0, suspended: 0 },
  );

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      activeGroups: groups.filter((group) => group.riskLevel !== GROUP_RISK_LEVEL.SUSPENDED).length,
      totalMembers: groups.reduce((total, group) => total + group.memberCount, 0),
      flaggedOrSuspended,
      avgCollectionRatePercent,
    },
    riskDistribution,
    groups,
    recentActivity: [],
  };
}
