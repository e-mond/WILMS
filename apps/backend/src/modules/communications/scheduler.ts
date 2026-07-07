export type RecurrenceRule = 'DAILY' | 'WEEKLY' | 'MONTHLY' | string;

export function computeNextRunAt(
  rule: RecurrenceRule,
  from: Date,
  _timezone = 'Africa/Accra',
): Date {
  const next = new Date(from);

  switch (rule.toUpperCase()) {
    case 'DAILY':
      next.setDate(next.getDate() + 1);
      return next;
    case 'WEEKLY':
      next.setDate(next.getDate() + 7);
      return next;
    case 'MONTHLY':
      next.setMonth(next.getMonth() + 1);
      return next;
    default:
      return parseCustomCron(rule, from);
  }
}

function parseCustomCron(rule: string, from: Date): Date {
  const parts = rule.trim().split(/\s+/);
  const next = new Date(from);

  if (parts.length >= 2) {
    const hour = Number.parseInt(parts[1] ?? '9', 10);
    if (!Number.isNaN(hour) && hour >= 0 && hour <= 23) {
      next.setUTCHours(hour, 0, 0, 0);
      if (next <= from) {
        next.setDate(next.getDate() + 1);
      }
      return next;
    }
  }

  next.setDate(next.getDate() + 1);
  return next;
}
