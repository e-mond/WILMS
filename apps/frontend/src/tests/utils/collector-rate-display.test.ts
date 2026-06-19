import { describe, expect, it } from 'vitest';
import { collectorRateBarClass, collectorRateTextClass } from '@/utils/collector-rate-display';

describe('collector-rate-display', () => {
  it('maps top performers to green', () => {
    expect(collectorRateTextClass(95)).toBe('text-status-active');
    expect(collectorRateBarClass(95)).toBe('bg-status-active');
  });

  it('maps on-track performers to gold', () => {
    expect(collectorRateTextClass(84.2)).toBe('text-executive-gold');
    expect(collectorRateBarClass(78)).toBe('bg-executive-gold');
  });

  it('maps needs-attention performers to red', () => {
    expect(collectorRateTextClass(62)).toBe('text-danger');
    expect(collectorRateBarClass(62)).toBe('bg-danger');
  });
});
