import type { GroupSummary } from '@/types/group';
import type { GroupRiskReport } from '@/types/reports';

export function buildGroupRiskReport(groups: GroupSummary[]): GroupRiskReport {
  return {
    generatedAt: new Date().toISOString(),
    rows: groups.map((group) => ({
      groupId: group.id,
      groupName: group.name,
      community: group.community,
      collectionRatePercent: group.collectionRatePercent,
      riskLevel: group.riskLevel,
      activeMemberCount: group.activeMemberCount,
      memberCount: group.memberCount,
    })),
  };
}
