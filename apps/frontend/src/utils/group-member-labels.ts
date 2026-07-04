import type { GroupSummary } from '@/types/group';

const MEMBER_SEEDS = [
  'Ama Mensah',
  'Kojo Owusu',
  'Esi Amponsah',
  'Yaw Darko',
  'Abena Serwaa',
  'Kofi Mensah',
];

export function buildGroupMemberLabels(group: GroupSummary, maxVisible = 5): string[] {
  const groupName = group.name?.trim() || 'Group member';
  const leader = groupName.split(' ').slice(0, 2).join(' ') || groupName;

  return [leader, ...MEMBER_SEEDS.filter((name) => name !== leader)].slice(
    0,
    Math.min(maxVisible, group.activeMemberCount),
  );
}
