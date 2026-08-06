import { describe, expect, it } from 'vitest';
import { buildForecastSnapshot } from '../../modules/intelligence/service.js';

describe('intelligence forecasts', () => {
  it('returns a horizon series and conservative projection assumptions', async () => {
    const forecast = await buildForecastSnapshot(28);
    expect(forecast.horizonDays).toBe(28);
    expect(forecast.series.length).toBeGreaterThanOrEqual(4);
    expect(forecast.assumptions.method).toMatch(/schedule-based/i);
    expect(forecast.summary.expectedCollectionsPesewas).toBeGreaterThanOrEqual(0);
    expect(forecast.summary.projectedCollectionsPesewas).toBeLessThanOrEqual(
      forecast.summary.expectedCollectionsPesewas || forecast.summary.projectedCollectionsPesewas,
    );
  });
});
