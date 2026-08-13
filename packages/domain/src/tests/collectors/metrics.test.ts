import { describe, expect, it } from 'vitest';
import {
  calculateStreakWeeks,
  collectionRatePercent,
  resolveTrendDirection,
  rollingMonthKeys,
} from '../../modules/collectors/metrics.js';

describe('collector metrics', () => {
  it('builds rolling last-six month labels relative to now', () => {
    const keys = rollingMonthKeys(new Date('2026-08-13T12:00:00.000Z'), 6);
    expect(keys.map((entry) => entry.label)).toEqual(['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']);
  });

  it('calculates collection rate safely when expected is zero', () => {
    expect(collectionRatePercent(0, 0)).toBe(0);
    expect(collectionRatePercent(500, 0)).toBe(100);
    expect(collectionRatePercent(50, 100)).toBe(50);
  });

  it('resolves trend direction from period comparison', () => {
    expect(resolveTrendDirection(90, 80)).toBe('up');
    expect(resolveTrendDirection(70, 85)).toBe('down');
    expect(resolveTrendDirection(82, 80)).toBe('neutral');
  });

  it('calculates consecutive successful collection weeks', () => {
    const weeks = ['2026-W33', '2026-W32', '2026-W31', '2026-W30'];
    const success = new Set(['2026-W33', '2026-W32', '2026-W31']);
    expect(calculateStreakWeeks(weeks, success)).toBe(3);
    expect(calculateStreakWeeks(weeks, new Set(['2026-W32']))).toBe(0);
  });
});
