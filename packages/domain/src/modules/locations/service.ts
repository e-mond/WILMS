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
  code?: string | null;
  name: string;
  aliases?: string[];
  latitude?: number | null;
  longitude?: number | null;
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
      data: { regions: [], districts: [], communities: [] },
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
        name: row.name,
        code: row.code,
        aliases: row.aliases,
        latitude: row.latitude,
        longitude: row.longitude,
      })),
    },
  };
}

export async function suggestCommunity(input: {
  districtId?: string;
  proposedName: string;
  proposedByUserId?: string;
}) {
  const row = await locationMasterRepo.createPendingCommunitySuggestion({
    id: randomUUID(),
    districtId: input.districtId ?? null,
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

  const regionName = input.regionName?.trim().toLowerCase();
  const districtName = input.districtName?.trim().toLowerCase();
  const communityName = input.communityName?.trim().toLowerCase();

  const regionRows = await locationMasterRepo.listRegions();
  const region = regionRows.find((row) => row.name.toLowerCase() === regionName);
  if (!region) {
    return {};
  }

  const districtRows = await locationMasterRepo.listDistrictsByRegionId(region.id);
  const district = districtRows.find((row) => row.name.toLowerCase() === districtName);
  if (!district) {
    return { regionId: region.id };
  }

  const communityRows = await locationMasterRepo.listCommunitiesByDistrictId(district.id);
  const community = communityRows.find((row) => row.name.toLowerCase() === communityName);

  return {
    regionId: region.id,
    districtId: district.id,
    communityId: community?.id,
  };
}
