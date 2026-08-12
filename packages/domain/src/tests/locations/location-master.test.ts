import { describe, expect, it } from 'vitest';
import { buildStableLocationId } from '../../modules/locations/service.js';

describe('location master identifiers', () => {
  it('builds stable UUIDs for the same source and source id', () => {
    const first = buildStableLocationId('geoBoundaries', 'region:GAR');
    const second = buildStableLocationId('geoBoundaries', 'region:GAR');
    expect(first).toBe(second);
    expect(first).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('builds different UUIDs for different source ids', () => {
    const left = buildStableLocationId('geoBoundaries', 'region:GAR');
    const right = buildStableLocationId('geoBoundaries', 'region:ASR');
    expect(left).not.toBe(right);
  });
});
