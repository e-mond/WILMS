import type { DashboardTrendDirection } from '@/types/dashboard';

/**
 * Builds a decorative 7-point series for KPI sparklines from trend direction.
 * Visual only — does not represent persisted time-series metrics.
 */
export function buildTrendSparklineValues(
  direction: DashboardTrendDirection | undefined,
  seed = 40,
): number[] {
  const base = [seed, seed + 4, seed - 2, seed + 8, seed + 3, seed + 10, seed + 6];
  if (direction === 'down') {
    return base.map((value, index) => value - index * 3).reverse();
  }
  if (direction === 'neutral') {
    return base.map((value, index) => value + (index % 2 === 0 ? 1 : -1));
  }
  return base.map((value, index) => value + index * 2);
}
