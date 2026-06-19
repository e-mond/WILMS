import type {
  ApprovedBorrowerFormationRecord,
  AutoGroupCreationResult,
  GroupFormationConfig,
  GroupFormationStatus,
} from '@/types/group-formation';
import type { GroupSourceRecord, GroupSummary } from '@/types/group';
import { GROUP_RISK_LEVEL } from '@/types/group';
import {
  buildDefaultGroupDisplayName,
  buildGroupFormationMonthKey,
  buildGroupSystemId,
} from '@/utils/group-system-id';

const approvedByCommunity = new Map<string, ApprovedBorrowerFormationRecord[]>();
const sequenceByMonthKey = new Map<string, number>();
const automatedGroups: GroupSourceRecord[] = [];

function normalizeCommunity(community: string): string {
  return community.trim().toLowerCase();
}

export function resetGroupFormationStore(): void {
  approvedByCommunity.clear();
  sequenceByMonthKey.clear();
  automatedGroups.length = 0;
}

export function getAutomatedGroupSources(): GroupSourceRecord[] {
  return automatedGroups.map((entry) => ({ ...entry }));
}

export function updateAutomatedGroupDisplayName(
  groupId: string,
  displayName: string,
): GroupSourceRecord | undefined {
  const trimmed = displayName.trim();

  if (!trimmed) {
    return undefined;
  }

  const index = automatedGroups.findIndex((entry) => entry.id === groupId);

  if (index === -1) {
    return undefined;
  }

  automatedGroups[index] = {
    ...automatedGroups[index]!,
    displayName: trimmed,
    name: trimmed,
  };

  return { ...automatedGroups[index]! };
}

export function getGroupFormationStatus(
  community: string,
  config: GroupFormationConfig,
): GroupFormationStatus {
  const approvedCount = approvedByCommunity.get(normalizeCommunity(community))?.length ?? 0;

  return {
    community,
    approvedCount,
    minGroupSize: config.minGroupSize,
    maxGroupSize: config.maxGroupSize,
    readyForFormation: approvedCount >= config.minGroupSize,
  };
}

export function processApprovedBorrowerForGroupFormation(input: {
  borrowerId: string;
  fullName: string;
  community: string;
  approvedAt: string;
  config: GroupFormationConfig;
}): AutoGroupCreationResult {
  const communityKey = normalizeCommunity(input.community);
  const queue = approvedByCommunity.get(communityKey) ?? [];

  queue.push({
    borrowerId: input.borrowerId,
    fullName: input.fullName,
    community: input.community,
    approvedAt: input.approvedAt,
  });
  approvedByCommunity.set(communityKey, queue);

  if (queue.length < input.config.minGroupSize) {
    return {
      created: false,
      message: `${queue.length} of ${input.config.minGroupSize} approved members in ${input.community}.`,
    };
  }

  const batch = queue.splice(0, input.config.maxGroupSize);
  approvedByCommunity.set(communityKey, queue);

  const approvedDate = new Date(input.approvedAt);
  const monthKey = buildGroupFormationMonthKey(input.community, approvedDate);
  const nextSequence = (sequenceByMonthKey.get(monthKey) ?? 0) + 1;
  sequenceByMonthKey.set(monthKey, nextSequence);

  const groupSystemId = buildGroupSystemId(input.community, approvedDate, nextSequence);
  const displayName = buildDefaultGroupDisplayName(input.community, nextSequence);
  const groupId = `GRP-AUTO-${String(automatedGroups.length + 1).padStart(4, '0')}`;
  const leaderName = batch[0]?.fullName ?? 'Pending Leader';

  const source: GroupSourceRecord = {
    id: groupId,
    name: displayName,
    groupSystemId,
    displayName,
    community: input.community,
    officerName: 'System Automation',
    leaderName,
    formedAt: input.approvedAt,
    memberCount: batch.length,
    activeMemberCount: batch.length,
    disbursedPesewas: 0,
    collectedPesewas: 0,
    collectionRatePercent: 0,
  };

  automatedGroups.push(source);

  return {
    created: true,
    groupId,
    groupSystemId,
    displayName,
    memberCount: batch.length,
    message: `Group ${groupSystemId} created for ${input.community} with ${batch.length} members.`,
  };
}

export function toAutomatedGroupSummary(source: GroupSourceRecord): GroupSummary {
  return {
    id: source.id,
    name: source.displayName ?? source.name,
    groupSystemId: source.groupSystemId ?? source.id,
    displayName: source.displayName ?? source.name,
    community: source.community,
    officerName: source.officerName,
    formedAt: source.formedAt,
    memberCount: source.memberCount,
    activeMemberCount: source.activeMemberCount,
    disbursedPesewas: source.disbursedPesewas,
    collectedPesewas: source.collectedPesewas,
    collectionRatePercent: source.collectionRatePercent,
    riskLevel: GROUP_RISK_LEVEL.LOW_RISK,
  };
}
