import {
  formatCollectorDisplayId,
  formatEntityDisplayId,
  formatLoanDisplayId,
  formatPoolDisplayId,
} from '@wilms/shared-utils';

export { formatCollectorDisplayId, formatEntityDisplayId, formatLoanDisplayId, formatPoolDisplayId };

export function assignLoanDisplayIds<T extends { cycleBatch: string; startDate: string }>(
  rows: T[],
): Array<T & { displayId: string }> {
  const batchCounters = new Map<string, number>();

  return rows.map((row) => {
    const nextSequence = (batchCounters.get(row.cycleBatch) ?? 0) + 1;
    batchCounters.set(row.cycleBatch, nextSequence);

    return {
      ...row,
      displayId: formatLoanDisplayId({
        cycleBatch: row.cycleBatch,
        startDate: row.startDate,
        sequence: nextSequence,
      }),
    };
  });
}

export function assignPoolDisplayIds<T extends { region: string; name: string }>(
  rows: T[],
): Array<T & { displayId: string }> {
  const regionCounters = new Map<string, number>();

  return rows.map((row) => {
    const regionKey = row.region.trim().toLowerCase();
    const nextSequence = (regionCounters.get(regionKey) ?? 0) + 1;
    regionCounters.set(regionKey, nextSequence);

    return {
      ...row,
      displayId: formatPoolDisplayId({
        region: row.region,
        name: row.name,
        sequence: nextSequence,
      }),
    };
  });
}
