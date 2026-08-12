import { describe, expect, it } from 'vitest';
import { loadValidatedSnapshot } from '../../../../../scripts/location-sync/pipeline.js';
import { deriveMmdaCategory, normaliseMatchKey, titleCaseAdministrativeName } from '../../../../../scripts/location-sync/normalize.js';
import { STMA_ELECTORAL_AREAS, STMA_SUB_METROS } from '../../../../../scripts/location-sync/datasets/stma-hierarchy.js';
import { buildStableLocationId } from '../../modules/locations/service.js';

describe('Ghana administrative hierarchy v2', () => {
  it('loads 16 regions and 261 MMDAs from the verified IMCCOD snapshot', async () => {
    const snapshot = await loadValidatedSnapshot('gss');
    expect(snapshot.regions).toHaveLength(16);
    expect(snapshot.districts).toHaveLength(261);
    expect(snapshot.districts.filter((row) => row.category === 'Metropolitan').length).toBeGreaterThanOrEqual(6);
    expect(snapshot.subDistrictUnits).toHaveLength(STMA_SUB_METROS.length);
    expect(snapshot.electoralAreas).toHaveLength(STMA_ELECTORAL_AREAS.length);
    expect(snapshot.checksum).toMatch(/^[a-f0-9]{64}$/);
  });

  it('includes verified Sekondi-Takoradi localities without inventing unsourced names', async () => {
    const snapshot = await loadValidatedSnapshot('gss');
    const names = new Set(snapshot.communities.map((row) => row.name.toLowerCase()));
    expect(names.has('kweikuma')).toBe(true);
    expect(names.has('fijai')).toBe(true);
    expect(names.has('adiembra')).toBe(true);
    expect(names.has('ngyiresia')).toBe(true);
    expect(names.has('bakado')).toBe(true);
    expect(names.has('european town')).toBe(false);
  });

  it('normalises MMDA categories and hyphen/space variants', () => {
    expect(deriveMmdaCategory('SEKONDI TAKORADI METROPOLITAN')).toBe('Metropolitan');
    expect(deriveMmdaCategory('ASUNAFO NORTH MUNICIPAL')).toBe('Municipal');
    expect(deriveMmdaCategory('ASUNAFO SOUTH')).toBe('District');
    expect(titleCaseAdministrativeName('MAMPONG MUNICPAL')).toBe('Mampong Municipal');
    expect(normaliseMatchKey('Sekondi-Takoradi Metropolitan')).toBe(
      normaliseMatchKey('Sekondi Takoradi Metropolitan'),
    );
  });

  it('keeps location identifiers stable for the same source key', () => {
    const first = buildStableLocationId('imccod+stma', 'imccod:243');
    const second = buildStableLocationId('imccod+stma', 'imccod:243');
    expect(first).toBe(second);
  });
});
