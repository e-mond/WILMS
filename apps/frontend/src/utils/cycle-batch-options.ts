import { LOAN_CYCLE_BATCH_SUGGESTIONS } from '@/constants/loan';

export function buildCycleBatchFilterOptions(
  entries: Array<{ cycleBatch: string }>,
): Array<{ value: string; label: string }> {
  const labels = new Set<string>(LOAN_CYCLE_BATCH_SUGGESTIONS);

  for (const entry of entries) {
    const label = entry.cycleBatch.trim();
    if (label) {
      labels.add(label);
    }
  }

  return [
    { value: '', label: 'All cycles' },
    ...Array.from(labels)
      .sort((left, right) => left.localeCompare(right))
      .map((cycle) => ({ value: cycle, label: cycle })),
  ];
}
