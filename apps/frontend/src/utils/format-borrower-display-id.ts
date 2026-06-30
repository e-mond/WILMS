export function formatBorrowerDisplayId(
  input: { community?: string; registeredAt?: string; id: string },
  sequence?: number,
): string {
  if (input.community && input.registeredAt && sequence) {
    const communityCode =
      input.community.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'WILMS';
    const monthKey = input.registeredAt.slice(0, 7).replace('-', '');

    return `BWR-${communityCode}-${monthKey}-${String(sequence).padStart(4, '0')}`;
  }

  const compactId = input.id.replace(/-/g, '').slice(0, 8).toUpperCase();

  return `BWR-${compactId}`;
}

export function resolveBorrowerDisplayId(
  borrower: { id: string; displayId?: string; community?: string; registeredAt?: string },
  sequence?: number,
): string {
  return borrower.displayId ?? formatBorrowerDisplayId(borrower, sequence);
}
