import type { GroupSummaryItem } from '../../modules/groups/service.js';

export interface GroupRiskReportRow {
  groupId: string;
  groupName: string;
  community: string;
  collectionRatePercent: number;
  riskLevel: string;
  activeMemberCount: number;
  memberCount: number;
}

export interface GroupRiskReport {
  generatedAt: string;
  rows: GroupRiskReportRow[];
}

export function buildGroupRiskReport(groups: GroupSummaryItem[]): GroupRiskReport {
  return {
    generatedAt: new Date().toISOString(),
    rows: groups.map((group) => ({
      groupId: group.id,
      groupName: group.displayName,
      community: group.community,
      collectionRatePercent: group.collectionRatePercent,
      riskLevel: group.riskLevel,
      activeMemberCount: group.activeMemberCount,
      memberCount: group.memberCount,
    })),
  };
}
