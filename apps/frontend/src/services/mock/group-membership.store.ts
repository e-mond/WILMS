import type { GroupMember } from '@/types/group';

const removedMemberIds = new Map<string, Set<string>>();
const addedMembers = new Map<string, GroupMember[]>();
const leaderReplacements = new Map<string, string>();
const collectorReassignments = new Map<string, string>();

export function getRemovedMemberIds(groupId: string): ReadonlySet<string> {
  return removedMemberIds.get(groupId) ?? new Set();
}

export function getAddedMembers(groupId: string): readonly GroupMember[] {
  return addedMembers.get(groupId) ?? [];
}

export function getLeaderReplacement(groupId: string): string | undefined {
  return leaderReplacements.get(groupId);
}

export function getCollectorReassignment(groupId: string): string | undefined {
  return collectorReassignments.get(groupId);
}

export function markMemberRemoved(groupId: string, borrowerId: string): void {
  const existing = removedMemberIds.get(groupId) ?? new Set<string>();
  existing.add(borrowerId);
  removedMemberIds.set(groupId, existing);
}

export function addGroupMember(groupId: string, member: GroupMember): void {
  const existing = addedMembers.get(groupId) ?? [];
  addedMembers.set(groupId, [...existing, member]);
}

export function replaceGroupLeader(groupId: string, borrowerId: string): void {
  leaderReplacements.set(groupId, borrowerId);
}

export function reassignGroupCollector(groupId: string, collectorId: string): void {
  collectorReassignments.set(groupId, collectorId);
}

export function resetGroupMembershipStore(): void {
  removedMemberIds.clear();
  addedMembers.clear();
  leaderReplacements.clear();
  collectorReassignments.clear();
}
