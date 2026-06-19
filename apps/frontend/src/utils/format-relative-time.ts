const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

export function formatRelativeTime(isoTimestamp: string, now = new Date()): string {
  const recordedAt = new Date(isoTimestamp);
  const diffMs = now.getTime() - recordedAt.getTime();

  if (diffMs < MINUTE_MS) {
    return 'Just now';
  }

  if (diffMs < HOUR_MS) {
    const minutes = Math.floor(diffMs / MINUTE_MS);
    return `${minutes}m ago`;
  }

  if (diffMs < DAY_MS) {
    const hours = Math.floor(diffMs / HOUR_MS);
    return `${hours}h ago`;
  }

  const days = Math.floor(diffMs / DAY_MS);
  return `${days}d ago`;
}
