import { describe, expect, it } from 'vitest';
import { loadValidatedSnapshot } from '../../../../../scripts/location-sync/pipeline.js';
import { loadHotosmCommunityDataset } from '../../../../../scripts/location-sync/adapters/gss.js';
import {
  normaliseLocationQuery,
  resolveAgainstCandidates,
  scoreSimilarity,
} from '../../modules/locations/alias-resolution.js';
import { STMA_COMMUNITIES, STMA_ELECTORAL_AREAS } from '../../../../../scripts/location-sync/datasets/stma-hierarchy.js';
import { normaliseMatchKey } from '../../../../../scripts/location-sync/normalize.js';

describe('community location completion', () => {
  it('keeps 16 regions / 261 MMDAs and verified STMA communities', async () => {
    const snapshot = await loadValidatedSnapshot('gss');
    expect(snapshot.regions).toHaveLength(16);
    expect(snapshot.districts).toHaveLength(261);
    expect(snapshot.electoralAreas).toHaveLength(STMA_ELECTORAL_AREAS.length);
    expect(snapshot.communities.length).toBeGreaterThanOrEqual(261 + STMA_COMMUNITIES.length);
    expect(snapshot.communities.some((row) => row.name === 'European Town')).toBe(true);
    expect(snapshot.communities.some((row) => row.name === 'Essaman')).toBe(true);
    expect(snapshot.communities.some((row) => row.name === 'Nkontompo')).toBe(true);
  });

  it('matches HOTOSM Metropolis names to IMCCOD Metropolitan MMDAs', () => {
    expect(normaliseMatchKey('Sekondi Takoradi Metropolis')).toBe(
      normaliseMatchKey('Sekondi Takoradi Metropolitan'),
    );
    const hotosm = loadHotosmCommunityDataset();
    expect(hotosm.communities.length).toBeGreaterThan(5000);
    expect(hotosm.communities.every((row) => row.districtSourceId.startsWith('imccod:'))).toBe(true);
    expect(hotosm.communities.every((row) => !row.electoralAreaSourceId)).toBe(true);
    expect(hotosm.communities.some((row) => /^Sekondi$/i.test(row.name))).toBe(true);
    expect(hotosm.communities.some((row) => /^Takoradi$/i.test(row.name))).toBe(true);
  });

  it('normalises aliases and ranks fuzzy / prefix community matches', () => {
    expect(normaliseLocationQuery('Sekondi-Takoradi')).toBe('sekondi takoradi');
    expect(scoreSimilarity('Market Circle', 'market  circle')).toBeGreaterThan(0.9);
    const matches = resolveAgainstCandidates('Nkontompo', [
      { entityType: 'community', entityId: '1', name: 'Nkontompo', aliases: [] },
      { entityType: 'community', entityId: '2', name: 'Kweikuma', aliases: ['Kwei Kuma'] },
    ]);
    expect(matches[0]?.entityId).toBe('1');
    expect(matches[0]?.matchKind).toBe('exact');

    const aliasMatches = resolveAgainstCandidates('Kwei Kuma', [
      { entityType: 'community', entityId: '2', name: 'Kweikuma', aliases: ['Kwei Kuma'] },
    ]);
    expect(aliasMatches[0]?.entityId).toBe('2');
  });

  it('does not invent electoral parents for HOTOSM communities', () => {
    const hotosm = loadHotosmCommunityDataset();
    expect(hotosm.communities.every((row) => row.electoralAreaSourceId == null)).toBe(true);
  });
});
