export type AuditLogPeriodKey =
  | 'today'
  | 'yesterday'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'older';

export interface AuditLogPeriodGroup<T> {
  key: AuditLogPeriodKey;
  label: string;
  entries: T[];
}

const PERIOD_LABELS: Record<AuditLogPeriodKey, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  thisWeek: 'This Week',
  lastWeek: 'Last Week',
  thisMonth: 'This Month',
  older: 'Older',
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function resolvePeriodKey(timestamp: string, now = new Date()): AuditLogPeriodKey {
  const entryDate = new Date(timestamp);
  if (Number.isNaN(entryDate.getTime())) {
    return 'older';
  }

  const today = startOfDay(now);
  const entryDay = startOfDay(entryDate);
  const diffDays = Math.floor((today.getTime() - entryDay.getTime()) / 86_400_000);

  if (diffDays === 0) {
    return 'today';
  }

  if (diffDays === 1) {
    return 'yesterday';
  }

  const dayOfWeek = today.getDay();
  const startOfThisWeek = new Date(today);
  startOfThisWeek.setDate(today.getDate() - dayOfWeek);
  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  if (entryDay >= startOfThisWeek) {
    return 'thisWeek';
  }

  if (entryDay >= startOfLastWeek) {
    return 'lastWeek';
  }

  if (entryDay >= startOfMonth) {
    return 'thisMonth';
  }

  return 'older';
}

export function groupAuditEntriesByPeriod<T extends { timestamp: string }>(
  entries: T[],
): AuditLogPeriodGroup<T>[] {
  const order: AuditLogPeriodKey[] = [
    'today',
    'yesterday',
    'thisWeek',
    'lastWeek',
    'thisMonth',
    'older',
  ];

  const buckets = new Map<AuditLogPeriodKey, T[]>();
  for (const key of order) {
    buckets.set(key, []);
  }

  for (const entry of entries) {
    const key = resolvePeriodKey(entry.timestamp);
    buckets.get(key)?.push(entry);
  }

  return order
    .map((key) => ({
      key,
      label: PERIOD_LABELS[key],
      entries: buckets.get(key) ?? [],
    }))
    .filter((group) => group.entries.length > 0);
}
