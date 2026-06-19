import { GROUP_RISK_DISPLAY } from '@/constants/group-risk-display';
import { GROUP_RISK_LEVEL, type GroupSourceRecord } from '@/types/group';
import type { GroupDetail } from '@/types/group-detail';
import { enrichGroupSummary } from '@/utils/group-profile';
import {
  buildGroupLeaderProfile,
  countActiveLoans,
  resolveGroupCollector,
  resolveGroupCycle,
  resolveGroupMembers,
  resolveGroupRiskHistory,
  resolveGroupStatusMeta,
} from '@/services/mock/group-members.resolver';

export function buildGroupDetail(source: GroupSourceRecord): GroupDetail {
  const summary = enrichGroupSummary(source);
  const members = resolveGroupMembers(source);
  const statusMeta = resolveGroupStatusMeta(summary.riskLevel);
  const cycle = resolveGroupCycle(source);
  const activeLoanCount = countActiveLoans(members);

  return {
    ...summary,
    status: statusMeta.status,
    statusLabel: statusMeta.label,
    leaderName: source.leaderName,
    leader: buildGroupLeaderProfile(source, members),
    collector: resolveGroupCollector(source),
    registrationOfficerName: source.officerName,
    cycle,
    activeLoanCount,
    repaymentPerformancePercent: summary.collectionRatePercent,
    outstandingPesewas: Math.max(source.disbursedPesewas - source.collectedPesewas, 0),
    members,
    riskHistory: [...resolveGroupRiskHistory(source.id)].sort(
      (left, right) => new Date(right.recordedAt).getTime() - new Date(left.recordedAt).getTime(),
    ),
    recentActivity: buildRecentActivity(source, summary.riskLevel),
  };
}

function buildRecentActivity(
  source: GroupSourceRecord,
  riskLevel: (typeof GROUP_RISK_LEVEL)[keyof typeof GROUP_RISK_LEVEL],
) {
  const now = Date.now();

  return [
    {
      id: `${source.id}-act-current`,
      message: `${source.name} risk level is ${GROUP_RISK_DISPLAY[riskLevel].label}`,
      recordedAt: new Date(now - 2 * 3_600_000).toISOString(),
    },
    {
      id: `${source.id}-act-members`,
      message: `${source.name} has ${source.activeMemberCount} active members in ${source.community}`,
      recordedAt: new Date(now - 8 * 3_600_000).toISOString(),
    },
    ...(riskLevel === GROUP_RISK_LEVEL.FLAGGED || riskLevel === GROUP_RISK_LEVEL.SUSPENDED
      ? [
          {
            id: `${source.id}-act-review`,
            message: `${source.name} requires Super Admin review`,
            recordedAt: new Date(now - 86_400_000).toISOString(),
          },
        ]
      : []),
  ];
}
