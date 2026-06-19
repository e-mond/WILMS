const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

function isSameCalendarDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function isYesterday(recordedAt: Date, now: Date): boolean {
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameCalendarDay(recordedAt, yesterday);
}

function formatClockTime(date: Date): string {
  return new Intl.DateTimeFormat('en-GH', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

function formatRelativeLabel(diffMs: number): string {
  if (diffMs < MINUTE_MS) {
    return 'Just now';
  }

  if (diffMs < HOUR_MS) {
    const minutes = Math.floor(diffMs / MINUTE_MS);
    return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  }

  if (diffMs < DAY_MS) {
    const hours = Math.floor(diffMs / HOUR_MS);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.floor(diffMs / DAY_MS);
  if (days === 1) {
    return 'Yesterday';
  }

  return `${days} days ago`;
}

export interface AlertTimestampParts {
  relative: string;
  absolute: string;
}

export function formatAlertTimestamp(isoTimestamp: string, now = new Date()): AlertTimestampParts {
  const recordedAt = new Date(isoTimestamp);
  const diffMs = Math.max(0, now.getTime() - recordedAt.getTime());
  const relative = formatRelativeLabel(diffMs);
  const clock = formatClockTime(recordedAt);

  if (isSameCalendarDay(recordedAt, now)) {
    return { relative, absolute: `Today ${clock}` };
  }

  if (isYesterday(recordedAt, now)) {
    return { relative, absolute: `Yesterday ${clock}` };
  }

  const dateLabel = new Intl.DateTimeFormat('en-GH', {
    month: 'short',
    day: 'numeric',
  }).format(recordedAt);

  return { relative, absolute: `${dateLabel} ${clock}` };
}
