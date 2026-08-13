import { describe, expect, it } from 'vitest';
import {
  collectorTrendSymbol,
  resolveCollectorTrendDirection,
  rollingSixMonthLabels,
} from '@/utils/collector-trend';

describe('collector-trend utils', () => {
  it('uses explicit trendDirection when present', () => {
    expect(
      resolveCollectorTrendDirection({
        trendDirection: 'down',
        rateTrend: [10, 90],
      }),
    ).toBe('down');
  });

  it('derives trend from rateTrend series', () => {
    expect(resolveCollectorTrendDirection({ rateTrend: [70, 90] })).toBe('up');
    expect(collectorTrendSymbol('up')).toBe('↑');
    expect(collectorTrendSymbol('down')).toBe('↓');
    expect(collectorTrendSymbol('neutral')).toBe('→');
  });

  it('returns rolling six month labels ending at current month', () => {
    const labels = rollingSixMonthLabels(new Date(Date.UTC(2026, 7, 13)));
    expect(labels).toEqual(['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']);
  });
});
