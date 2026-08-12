import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadValidatedSnapshot } from '../../../../../scripts/location-sync/pipeline.js';
import { loadHotosmCommunityDataset } from '../../../../../scripts/location-sync/adapters/gss.js';
import {
  normaliseLocationQuery,
  resolveAgainstCandidates,
  scoreSimilarity,
} from '../../modules/locations/alias-resolution.js';
import { STMA_ELECTORAL_AREAS } from '../../../../../scripts/location-sync/datasets/stma-hierarchy.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../../../../');

describe('national locality completion', () => {
  it('keeps 16 regions / 261 MMDAs and adds IMCCOD capital communities', async () => {
    const snapshot = await loadValidatedSnapshot('gss');
    expect(snapshot.regions).toHaveLength(16);
    expect(snapshot.districts).toHaveLength(261);
    expect(snapshot.electoralAreas).toHaveLength(STMA_ELECTORAL_AREAS.length);
    const capitals = snapshot.communities.filter((row) => row.sourceId.startsWith('imccod:capital:'));
    expect(capitals.length).toBe(261);
    expect(snapshot.communities.some((row) => row.name.toLowerCase() === 'kukuom')).toBe(true);
  });

  it('loads HOTOSM named communities matched to IMCCOD MMDAs without inventing electoral parents', () => {
    const hotosm = loadHotosmCommunityDataset();
    expect(hotosm.communities.length).toBeGreaterThan(5000);
    expect(hotosm.communities.every((row) => row.districtSourceId.startsWith('imccod:'))).toBe(true);
    expect(hotosm.communities.every((row) => !row.electoralAreaSourceId)).toBe(true);
    expect(hotosm.communities.some((row) => /accra/i.test(row.name))).toBe(true);
  });

  it('normalises aliases and ranks fuzzy matches', () => {
    expect(normaliseLocationQuery('Sekondi-Takoradi')).toBe('sekondi takoradi');
    expect(scoreSimilarity('Market Circle', 'market  circle')).toBeGreaterThan(0.9);
    const matches = resolveAgainstCandidates('Nkontompo', [
      { entityType: 'community', entityId: '1', name: 'Nkontompo', aliases: [] },
      { entityType: 'community', entityId: '2', name: 'Kweikuma', aliases: [] },
    ]);
    expect(matches[0]?.entityId).toBe('1');
    expect(matches[0]?.matchKind).toBe('exact');
  });

  it('parses the national coverage audit artefact', () => {
    const audit = JSON.parse(
      readFileSync(join(root, 'data/ghana-locations/national-coverage-audit.json'), 'utf8'),
    ) as { coverage: { regions: { imported: number }; mmdas: { imported: number } } };
    expect(audit.coverage.regions.imported).toBe(16);
    expect(audit.coverage.mmdas.imported).toBe(261);
  });
});
