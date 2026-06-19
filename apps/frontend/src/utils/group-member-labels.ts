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
  const leader = group.name.split(' ').slice(0, 2).join(' ') || group.name;

  return [leader, ...MEMBER_SEEDS.filter((name) => name !== leader)].slice(
    0,
    Math.min(maxVisible, group.activeMemberCount),
  );
}
