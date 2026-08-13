import { describe, expect, it } from 'vitest';
import { formatGpsDisplaySummary, isGpsFixDisplay } from '@wilms/shared-utils';
import { resolveCollectorStaffLabel } from '@/utils/entity-display-id';

describe('production closure display helpers', () => {
  it('formats collector staff labels as Name (COL-###)', () => {
    expect(
      resolveCollectorStaffLabel({
        fullName: 'Kwame Mensah',
        collectorCode: 'COL-012',
      }),
    ).toBe('Kwame Mensah (COL-012)');

    expect(
      resolveCollectorStaffLabel({
        collectorLabel: 'Field Collector (COL-012)',
      }),
    ).toBe('Field Collector (COL-012)');
  });

  it('formats GPS captures with accuracy, timestamp, and source', () => {
    expect(
      formatGpsDisplaySummary({
        latitude: 5.6037,
        longitude: -0.187,
        accuracy: 12.4,
        capturedAt: '2026-08-13T10:00:00.000Z',
        source: 'device',
      }),
    ).toBe('5.603700, -0.187000 ±12m · 2026-08-13T10:00:00.000Z · device');

    expect(
      formatGpsDisplaySummary({
        unavailable: true,
        reason: 'Permission denied',
        capturedAt: '2026-08-13T10:00:00.000Z',
        source: 'exception',
      }),
    ).toBe('Unavailable — Permission denied · 2026-08-13T10:00:00.000Z · exception');

    expect(isGpsFixDisplay({ latitude: 1, longitude: 2 })).toBe(true);
  });
});
