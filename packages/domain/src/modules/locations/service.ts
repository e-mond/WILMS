import { randomUUID, createHash } from 'node:crypto';
import { isDatabaseEnabled } from '../../db/client.js';
import {
  getGhanaCities,
  getGhanaDistricts,
  getGhanaRegions,
  searchGhanaLocations,
} from '../../lib/ghana-locations.js';
import * as locationMasterRepo from '../../repositories/location-master.repository.js';

export interface LocationResponseMeta {
  version: string;
  source: string;
  lastUpdated: string | null;
}

export interface RegionDto {
  id: string;
  code?: string | null;
  name: string;
}

export interface DistrictDto {
  id: string;
  regionId: string;
  code?: string | null;
  name: string;
  category?: string;
}

export interface CommunityDto {
  id: string;
  districtId: string;
  electoralAreaId?: string | null;
  code?: string | null;
  name: string;
  aliases?: string[];
  latitude?: number | null;
  longitude?: number | null;
}

export interface SubDistrictUnitDto {
  id: string;
  districtId: string;
  code?: string | null;
  name: string;
  unitType: string;
}

export interface ElectoralAreaDto {
  id: string;
  districtId: string;
  subDistrictUnitId?: string | null;
  code?: string | null;
  name: string;
}

function stableUuid(seed: string): string {
  const hash = createHash('sha1').update(seed).digest('hex');
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `5${hash.slice(13, 16)}`,
    `${((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80).toString(16)}${hash.slice(18, 20)}`,
    hash.slice(20, 32),
  ].join('-');
}

function fallbackMeta(source: string): LocationResponseMeta {
  return {
    version: 'bundled-v1',
    source,
    lastUpdated: null,
  };
}

export async function listRegions() {
  if (!isDatabaseEnabled()) {
    return {
      meta: fallbackMeta('bundled'),
      data: (await getGhanaRegions()).map((row) => ({ id: row.id, name: row.name, code: null })),
    };
  }

  const rows = await locationMasterRepo.listRegions();
  if (rows.length === 0) {
    return {
      meta: fallbackMeta('bundled'),
      data: (await getGhanaRegions()).map((row) => ({ id: row.id, name: row.name, code: null })),
    };
  }

  const sync = await locationMasterRepo.getLatestLocationSync();
  return {
    meta: {
      version: sync?.datasetVersion ?? rows[0].datasetVersion,
      source: sync?.datasetSource ?? rows[0].source,
      lastUpdated: sync?.importedAt?.toISOString() ?? rows[0].updatedAt.toISOString(),
    },
    data: rows.map((row) => ({ id: row.id, name: row.name, code: row.code })),
  };
}

export async function listDistricts(regionId: string) {
  if (!isDatabaseEnabled()) {
    return {
      meta: fallbackMeta('bundled'),
      data: (await getGhanaDistricts(regionId)).map((row) => ({
        id: row.id,
        regionId: row.regionId,
        name: row.name,
        code: null,
        category: row.type,
      })),
    };
  }

  const rows = await locationMasterRepo.listDistrictsByRegionId(regionId);
  if (rows.length === 0) {
    return {
      meta: fallbackMeta('bundled'),
      data: (await getGhanaDistricts(regionId)).map((row) => ({
        id: row.id,
        regionId: row.regionId,
        name: row.name,
        code: null,
        category: row.type,
      })),
    };
  }

  const sync = await locationMasterRepo.getLatestLocationSync();
  return {
    meta: {
      version: sync?.datasetVersion ?? rows[0].datasetVersion,
      source: sync?.datasetSource ?? rows[0].source,
      lastUpdated: sync?.importedAt?.toISOString() ?? rows[0].updatedAt.toISOString(),
    },
    data: rows.map((row) => ({
      id: row.id,
      regionId: row.regionId,
      name: row.name,
      code: row.code,
      category: row.category,
    })),
  };
}

export async function listCommunities(districtId: string) {
  if (!isDatabaseEnabled()) {
    return {
      meta: fallbackMeta('bundled'),
      data: (await getGhanaCities(districtId)).map((row) => ({
        id: row.id,
        districtId: row.districtId,
        name: row.name,
        code: null,
        aliases: [],
        latitude: null,
        longitude: null,
      })),
    };
  }

  const rows = await locationMasterRepo.listCommunitiesByDistrictId(districtId);
  if (rows.length === 0) {
    return {
      meta: fallbackMeta('bundled'),
      data: (await getGhanaCities(districtId)).map((row) => ({
        id: row.id,
        districtId: row.districtId,
        name: row.name,
        code: null,
        aliases: [],
        latitude: null,
        longitude: null,
      })),
    };
  }

  const sync = await locationMasterRepo.getLatestLocationSync();
  return {
    meta: {
      version: sync?.datasetVersion ?? rows[0].datasetVersion,
      source: sync?.datasetSource ?? rows[0].source,
      lastUpdated: sync?.importedAt?.toISOString() ?? rows[0].updatedAt.toISOString(),
    },
    data: rows.map((row) => ({
      id: row.id,
      districtId: row.districtId,
      electoralAreaId: row.electoralAreaId ?? null,
      name: row.name,
      code: row.code,
      aliases: row.aliases,
      latitude: row.latitude,
      longitude: row.longitude,
    })),
  };
}

export async function listSubDistrictUnits(districtId: string) {
  if (!isDatabaseEnabled()) {
    return { meta: fallbackMeta('bundled'), data: [] as SubDistrictUnitDto[] };
  }

  const rows = await locationMasterRepo.listSubDistrictUnitsByDistrictId(districtId);
  const sync = await locationMasterRepo.getLatestLocationSync();
  return {
    meta: {
      version: sync?.datasetVersion ?? 'unknown',
      source: sync?.datasetSource ?? 'database',
      lastUpdated: sync?.importedAt?.toISOString() ?? null,
    },
    data: rows.map((row) => ({
      id: row.id,
      districtId: row.districtId,
      name: row.name,
      code: row.code,
      unitType: row.unitType,
    })),
  };
}

export async function listElectoralAreas(input: { districtId?: string; subDistrictUnitId?: string }) {
  if (!isDatabaseEnabled()) {
    return { meta: fallbackMeta('bundled'), data: [] as ElectoralAreaDto[] };
  }

  const rows = input.subDistrictUnitId
    ? await locationMasterRepo.listElectoralAreasBySubDistrictUnitId(input.subDistrictUnitId)
    : input.districtId
      ? await locationMasterRepo.listElectoralAreasByDistrictId(input.districtId)
      : [];
  const sync = await locationMasterRepo.getLatestLocationSync();
  return {
    meta: {
      version: sync?.datasetVersion ?? 'unknown',
      source: sync?.datasetSource ?? 'database',
      lastUpdated: sync?.importedAt?.toISOString() ?? null,
    },
    data: rows.map((row) => ({
      id: row.id,
      districtId: row.districtId,
      subDistrictUnitId: row.subDistrictUnitId,
      name: row.name,
      code: row.code,
    })),
  };
}

export async function listCommunitiesByElectoralArea(electoralAreaId: string) {
  if (!isDatabaseEnabled()) {
    return { meta: fallbackMeta('bundled'), data: [] as CommunityDto[] };
  }

  const rows = await locationMasterRepo.listCommunitiesByElectoralAreaId(electoralAreaId);
  const sync = await locationMasterRepo.getLatestLocationSync();
  return {
    meta: {
      version: sync?.datasetVersion ?? 'unknown',
      source: sync?.datasetSource ?? 'database',
      lastUpdated: sync?.importedAt?.toISOString() ?? null,
    },
    data: rows.map((row) => ({
      id: row.id,
      districtId: row.districtId,
      electoralAreaId: row.electoralAreaId ?? electoralAreaId,
      name: row.name,
      code: row.code,
      aliases: row.aliases,
      latitude: row.latitude,
      longitude: row.longitude,
    })),
  };
}

export async function searchLocations(query: string) {
  const normalized = query.trim();
  if (!normalized) {
    return {
      meta: fallbackMeta('search'),
      data: { regions: [], districts: [], communities: [], subDistrictUnits: [], electoralAreas: [] },
    };
  }

  if (!isDatabaseEnabled()) {
    const bundled = await searchGhanaLocations(normalized);
    return {
      meta: fallbackMeta('bundled'),
      data: {
        regions: bundled.regions.map((row) => ({ id: row.id, name: row.name, code: null })),
        districts: bundled.districts.map((row) => ({
          id: row.id,
          regionId: row.regionId,
          name: row.name,
          code: null,
          category: row.type,
        })),
        communities: bundled.cities.map((row) => ({
          id: row.id,
          districtId: row.districtId,
          name: row.name,
          code: null,
          aliases: [],
          latitude: null,
          longitude: null,
        })),
        subDistrictUnits: [],
        electoralAreas: [],
      },
    };
  }

  const rows = await locationMasterRepo.searchLocations(normalized);
  const sync = await locationMasterRepo.getLatestLocationSync();
  return {
    meta: {
      version: sync?.datasetVersion ?? 'unknown',
      source: sync?.datasetSource ?? 'database',
      lastUpdated: sync?.importedAt?.toISOString() ?? null,
    },
    data: {
      regions: rows.regions.map((row) => ({ id: row.id, name: row.name, code: row.code })),
      districts: rows.districts.map((row) => ({
        id: row.id,
        regionId: row.regionId,
        name: row.name,
        code: row.code,
        category: row.category,
      })),
      communities: rows.communities.map((row) => ({
        id: row.id,
        districtId: row.districtId,
        electoralAreaId: row.electoralAreaId ?? null,
        name: row.name,
        code: row.code,
        aliases: row.aliases,
        latitude: row.latitude,
        longitude: row.longitude,
      })),
      subDistrictUnits: rows.subDistrictUnits.map((row) => ({
        id: row.id,
        districtId: row.districtId,
        name: row.name,
        code: row.code,
        unitType: row.unitType,
      })),
      electoralAreas: rows.electoralAreas.map((row) => ({
        id: row.id,
        districtId: row.districtId,
        subDistrictUnitId: row.subDistrictUnitId,
        name: row.name,
        code: row.code,
      })),
    },
  };
}

export async function autocompleteLocations(
  query: string,
  limit = 12,
  options?: {
    types?: Array<'region' | 'district' | 'sub_district_unit' | 'electoral_area' | 'community'>;
    districtId?: string;
  },
) {
  const normalized = query.trim();
  if (!normalized) {
    return {
      meta: fallbackMeta('autocomplete'),
      data: [] as Array<Record<string, unknown>>,
    };
  }

  if (!isDatabaseEnabled()) {
    const bundled = await searchGhanaLocations(normalized);
    const { resolveAgainstCandidates } = await import('./alias-resolution.js');
    const candidates = [
      ...bundled.regions.map((row) => ({
        entityType: 'region' as const,
        entityId: row.id,
        name: row.name,
      })),
      ...bundled.districts.map((row) => ({
        entityType: 'district' as const,
        entityId: row.id,
        name: row.name,
        regionId: row.regionId,
      })),
      ...bundled.cities
        .filter((row) => !options?.districtId || row.districtId === options.districtId)
        .map((row) => ({
          entityType: 'community' as const,
          entityId: row.id,
          name: row.name,
          districtId: row.districtId,
        })),
    ].filter((row) => !options?.types?.length || options.types.includes(row.entityType));
    return {
      meta: fallbackMeta('bundled'),
      data: resolveAgainstCandidates(normalized, candidates, { limit }).map((match) => ({
        type: match.entityType,
        id: match.entityId,
        name: match.name,
        score: match.score,
        matchKind: match.matchKind,
        regionId: match.regionId ?? null,
        districtId: match.districtId ?? null,
      })),
    };
  }

  const rows = await locationMasterRepo.searchLocationsRanked(normalized, limit, options);
  const sync = await locationMasterRepo.getLatestLocationSync();
  return {
    meta: {
      version: sync?.datasetVersion ?? 'unknown',
      source: sync?.datasetSource ?? 'database',
      lastUpdated: sync?.importedAt?.toISOString() ?? null,
    },
    data: rows,
  };
}

export async function suggestCommunity(input: {
  districtId?: string;
  electoralAreaId?: string;
  proposedName: string;
  proposedByUserId?: string;
}) {
  const row = await locationMasterRepo.createPendingCommunitySuggestion({
    id: randomUUID(),
    districtId: input.districtId ?? null,
    electoralAreaId: input.electoralAreaId ?? null,
    proposedName: input.proposedName.trim(),
    proposedByUserId: input.proposedByUserId ?? null,
  });
  return row;
}

export async function getSyncStatus() {
  const latest = await locationMasterRepo.getLatestLocationSync();
  return {
    meta: {
      version: latest?.datasetVersion ?? 'unknown',
      source: latest?.datasetSource ?? 'unknown',
      lastUpdated: latest?.importedAt?.toISOString() ?? null,
    },
    data: latest,
  };
}

export function buildStableLocationId(source: string, sourceId: string): string {
  return stableUuid(`${source}:${sourceId}`);
}

export async function resolveLocationIdsByNames(input: {
  regionName?: string;
  districtName?: string;
  communityName?: string;
}): Promise<{ regionId?: string; districtId?: string; communityId?: string }> {
  if (!isDatabaseEnabled()) {
    return {};
  }

  const { resolveAgainstCandidates } = await import('./alias-resolution.js');
  const regionName = input.regionName?.trim();
  const districtName = input.districtName?.trim();
  const communityName = input.communityName?.trim();

  const regionRows = await locationMasterRepo.listRegions();
  const regionMatch = regionName
    ? resolveAgainstCandidates(
        regionName,
        regionRows.map((row) => ({ entityType: 'region' as const, entityId: row.id, name: row.name })),
        { limit: 1, fuzzyThreshold: 0.9 },
      )[0]
    : undefined;
  if (!regionMatch) {
    return {};
  }

  const districtRows = await locationMasterRepo.listDistrictsByRegionId(regionMatch.entityId);
  const districtMatch = districtName
    ? resolveAgainstCandidates(
        districtName,
        districtRows.map((row) => ({
          entityType: 'district' as const,
          entityId: row.id,
          name: row.name,
          regionId: row.regionId,
        })),
        { limit: 1, fuzzyThreshold: 0.88 },
      )[0]
    : undefined;
  if (!districtMatch) {
    return { regionId: regionMatch.entityId };
  }

  const communityRows = await locationMasterRepo.listCommunitiesByDistrictId(districtMatch.entityId);
  const communityMatch = communityName
    ? resolveAgainstCandidates(
        communityName,
        communityRows.map((row) => ({
          entityType: 'community' as const,
          entityId: row.id,
          name: row.name,
          aliases: row.aliases,
          districtId: row.districtId,
        })),
        { limit: 1, fuzzyThreshold: 0.85 },
      )[0]
    : undefined;

  return {
    regionId: regionMatch.entityId,
    districtId: districtMatch.entityId,
    communityId: communityMatch?.entityId,
  };
}

export interface ReverseGeocodeResult {
  latitude: number;
  longitude: number;
  digitalAddress: string;
  resolvedFrom: 'community_code' | 'fallback';
  community?: string;
  district?: string;
  region?: string;
  regionCode?: string | null;
  communityId?: string;
  districtId?: string;
  regionId?: string;
  distanceMetres?: number;
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodeResult> {
  const { encodeFallbackDigitalAddress, haversineMetres, isGhanaDigitalAddress } = await import(
    './digital-address.js'
  );

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('VALIDATION:Latitude and longitude are required.');
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new Error('VALIDATION:Coordinates are outside the valid range.');
  }

  if (!isDatabaseEnabled()) {
    const digitalAddress = encodeFallbackDigitalAddress(latitude, longitude, 'GH');
    return {
      latitude,
      longitude,
      digitalAddress,
      resolvedFrom: 'fallback',
    };
  }

  const nearest = await locationMasterRepo.findNearestCommunity(latitude, longitude);
  if (!nearest || nearest.latitude == null || nearest.longitude == null) {
    return {
      latitude,
      longitude,
      digitalAddress: encodeFallbackDigitalAddress(latitude, longitude, 'GH'),
      resolvedFrom: 'fallback',
    };
  }

  const distanceMetres = haversineMetres(latitude, longitude, nearest.latitude, nearest.longitude);
  const storedCode = nearest.communityCode?.trim().toUpperCase() ?? '';
  const digitalAddress = isGhanaDigitalAddress(storedCode)
    ? storedCode
    : encodeFallbackDigitalAddress(latitude, longitude, nearest.regionCode);

  return {
    latitude,
    longitude,
    digitalAddress,
    resolvedFrom: isGhanaDigitalAddress(storedCode) ? 'community_code' : 'fallback',
    community: nearest.communityName,
    district: nearest.districtName,
    region: nearest.regionName,
    regionCode: nearest.regionCode,
    communityId: nearest.communityId,
    districtId: nearest.districtId,
    regionId: nearest.regionId,
    distanceMetres: Math.round(distanceMetres),
  };
}
