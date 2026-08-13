import { describe, expect, it } from 'vitest';
import { formatGpsSummary, isGpsException, isGpsFix } from '@/types/gps';

describe('collection GPS helpers', () => {
  it('summarises a captured fix', () => {
    const gps = {
      latitude: 5.6037,
      longitude: -0.187,
      accuracy: 12,
      capturedAt: '2026-08-13T12:00:00.000Z',
    };
    expect(isGpsFix(gps)).toBe(true);
    expect(formatGpsSummary(gps)).toContain('5.603700');
  });

  it('summarises an audited GPS exception', () => {
    const gps = {
      unavailable: true as const,
      reason: 'Indoor market',
      capturedAt: '2026-08-13T12:00:00.000Z',
    };
    expect(isGpsException(gps)).toBe(true);
    expect(formatGpsSummary(gps)).toBe(
      'Unavailable — Indoor market · 2026-08-13T12:00:00.000Z · exception',
    );
  });
});
