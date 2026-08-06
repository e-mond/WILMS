import { describe, expect, it } from 'vitest';
import { buildTrendSparklineValues } from '@/utils/kpi-sparkline';

describe('buildTrendSparklineValues', () => {
  it('returns seven points for each trend direction', () => {
    expect(buildTrendSparklineValues('up')).toHaveLength(7);
    expect(buildTrendSparklineValues('down')).toHaveLength(7);
    expect(buildTrendSparklineValues('neutral')).toHaveLength(7);
  });

  it('trends upward series higher at the end for up direction', () => {
    const values = buildTrendSparklineValues('up', 10);
    expect(values[values.length - 1]!).toBeGreaterThan(values[0]!);
  });
});
