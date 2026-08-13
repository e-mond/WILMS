import type { CollectorSummary } from '@/types/collector-management';

export type CollectorTrendDirection = 'up' | 'down' | 'neutral';

export function resolveCollectorTrendDirection(
  collector: Pick<CollectorSummary, 'trendDirection' | 'rateTrend'>,
): CollectorTrendDirection {
  if (collector.trendDirection) {
    return collector.trendDirection;
  }

  if (collector.rateTrend.length < 2) {
    return 'neutral';
  }

  const current = collector.rateTrend[collector.rateTrend.length - 1]!;
  const previous = collector.rateTrend[collector.rateTrend.length - 2]!;
  if (Math.abs(current - previous) <= 2) {
    return 'neutral';
  }
  return current > previous ? 'up' : 'down';
}

export function collectorTrendSymbol(direction: CollectorTrendDirection): string {
  if (direction === 'up') return '↑';
  if (direction === 'down') return '↓';
  return '→';
}

export function collectorTrendClassName(direction: CollectorTrendDirection): string {
  if (direction === 'up') return 'text-status-active';
  if (direction === 'down') return 'text-danger';
  return 'text-text-muted';
}

/** Rolling last-six calendar month labels relative to `now` (British short month). */
export function rollingSixMonthLabels(now = new Date()): string[] {
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const result: string[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    result.push(labels[d.getUTCMonth()]!);
  }
  return result;
}
