import { formatBorrowerDisplayId, isReadableWilmsId } from '@wilms/shared-utils';

export { formatBorrowerDisplayId };

export function resolveBorrowerDisplayId(
  borrower: { id: string; displayId?: string; community?: string; registeredAt?: string },
  sequence?: number,
): string {
  if (borrower.displayId) {
    return borrower.displayId;
  }

  if (isReadableWilmsId(borrower.id)) {
    return borrower.id.toUpperCase();
  }

  if (borrower.community && borrower.registeredAt && sequence != null) {
    return formatBorrowerDisplayId(
      { community: borrower.community, registeredAt: borrower.registeredAt, id: borrower.id },
      sequence,
    );
  }

  return formatBorrowerDisplayId({ community: '', registeredAt: '', id: borrower.id });
}
