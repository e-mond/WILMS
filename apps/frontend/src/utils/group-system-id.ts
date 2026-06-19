const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

function normalizeCommunityToken(community: string): string {
  const primary = community.split(',')[0]?.trim() || community.trim();
  return primary.replace(/\s+/g, '-');
}

export function buildGroupSystemId(community: string, date: Date, sequence: number): string {
  const communityToken = normalizeCommunityToken(community);
  const month = MONTH_NAMES[date.getMonth()];
  const suffix = String(sequence).padStart(3, '0');

  return `${communityToken}-${month}-${suffix}`;
}

export function buildDefaultGroupDisplayName(community: string, sequence: number): string {
  const primaryCommunity = community.split(',')[0]?.trim() || community.trim();

  return `Hope ${primaryCommunity} Group ${sequence}`;
}

export function buildGroupFormationMonthKey(community: string, date: Date): string {
  return `${normalizeCommunityToken(community)}:${date.getFullYear()}-${date.getMonth() + 1}`;
}
