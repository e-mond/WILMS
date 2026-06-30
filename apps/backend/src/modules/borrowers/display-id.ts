export function formatBorrowerDisplayId(
  input: { community: string; registeredAt: string },
  sequence: number,
): string {
  const communityCode =
    input.community.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'WILMS';
  const monthKey = input.registeredAt.slice(0, 7).replace('-', '');

  return `BWR-${communityCode}-${monthKey}-${String(sequence).padStart(4, '0')}`;
}
