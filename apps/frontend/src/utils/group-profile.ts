import { type GroupSourceRecord, type GroupSummary } from '@/types/group';
import { calculateGroupRiskLevel } from '@/utils/group-risk';

export function enrichGroupSummary(source: GroupSourceRecord): GroupSummary {
  const displayName = source.displayName ?? source.name;

  return {
    id: source.id,
    name: displayName,
    groupSystemId: source.groupSystemId ?? source.id,
    displayName,
    community: source.community,
    officerName: source.officerName,
    formedAt: source.formedAt,
    memberCount: source.memberCount,
    activeMemberCount: source.activeMemberCount,
    disbursedPesewas: source.disbursedPesewas,
    collectedPesewas: source.collectedPesewas,
    collectionRatePercent: source.collectionRatePercent,
    riskLevel: calculateGroupRiskLevel({
      collectionRatePercent: source.collectionRatePercent,
      memberCount: source.memberCount,
      activeMemberCount: source.activeMemberCount,
      defaultedMemberCount: source.defaultedMemberCount,
      isManuallySuspended: source.isManuallySuspended,
    }),
  };
}

export function buildGroupSummaries(sources: GroupSourceRecord[]): GroupSummary[] {
  return sources.map(enrichGroupSummary);
}

export { buildGroupDetail } from '@/services/mock/group-detail.builder';
export {
  getSyntheticBorrowerProfile,
  resetSyntheticBorrowerProfiles,
} from '@/services/mock/group-members.resolver';
