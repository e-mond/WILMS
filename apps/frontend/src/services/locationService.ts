import type {
  CommunitySuggestionInput,
  CurrentLocationResult,
  LocationCity,
  LocationCollectionResponse,
  LocationDistrict,
  LocationElectoralArea,
  LocationRegion,
  LocationResponseMeta,
  LocationSearchResponse,
  LocationSubDistrictUnit,
  LocationSyncStatusResponse,
} from '@/types/location';
import type { ILocationService } from '@/types/services';
import { apiClient } from '@/utils/apiClient';
import {
  getGhanaCities,
  getGhanaDistricts,
  getGhanaRegions,
} from '@/services/mock/factories/ghana-locations.factory';
import {
  cacheLocationCommunities,
  cacheLocationDistricts,
  cacheLocationElectoralAreas,
  cacheLocationRegions,
  cacheLocationSubDistrictUnits,
  readCachedLocationCommunities,
  readCachedLocationDistricts,
  readCachedLocationElectoralAreas,
  readCachedLocationHierarchy,
  readCachedLocationRegions,
  readCachedLocationSubDistrictUnits,
} from '@/lib/offline/locationOfflineCache';

function readBrowserGeolocation(): Promise<CurrentLocationResult> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not available in this browser. Enter GPS address manually.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(
            new Error(
              'Location permission denied. Allow location access or enter the GPS address manually.',
            ),
          );
          return;
        }

        reject(new Error('Unable to determine your current location. Try again or enter it manually.'));
      },
      {
        enableHighAccuracy: true,
        timeout: 15_000,
        maximumAge: 60_000,
      },
    );
  });
}

function unwrapCollection<T>(payload: LocationCollectionResponse<T> | T[]): T[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  return payload.data;
}

const locationService: ILocationService = {
  async getRegions(): Promise<LocationRegion[]> {
    try {
      const payload = await apiClient.get<LocationCollectionResponse<LocationRegion> | LocationRegion[]>(
        '/locations/regions',
      );
      const regions = unwrapCollection(payload);
      void cacheLocationRegions(regions);
      return regions;
    } catch {
      return (await readCachedLocationRegions()) ?? getGhanaRegions();
    }
  },

  async getDistricts(regionId: string): Promise<LocationDistrict[]> {
    try {
      const payload = await apiClient.get<
        LocationCollectionResponse<LocationDistrict> | LocationDistrict[]
      >(`/locations/regions/${regionId}/districts`);
      const districts = unwrapCollection(payload);
      void cacheLocationDistricts(regionId, districts);
      return districts;
    } catch {
      return (await readCachedLocationDistricts(regionId)) ?? getGhanaDistricts(regionId);
    }
  },

  async getCommunities(districtId: string): Promise<LocationCity[]> {
    try {
      const payload = await apiClient.get<LocationCollectionResponse<LocationCity> | LocationCity[]>(
        `/locations/districts/${districtId}/communities`,
      );
      const communities = unwrapCollection(payload);
      void cacheLocationCommunities(districtId, communities);
      return communities;
    } catch {
      return (await readCachedLocationCommunities(districtId)) ?? getGhanaCities(districtId);
    }
  },

  async getSubDistrictUnits(districtId: string): Promise<LocationSubDistrictUnit[]> {
    try {
      const payload = await apiClient.get<
        LocationCollectionResponse<LocationSubDistrictUnit> | LocationSubDistrictUnit[]
      >(`/locations/districts/${districtId}/sub-district-units`);
      const units = unwrapCollection(payload);
      void cacheLocationSubDistrictUnits(districtId, units);
      return units;
    } catch {
      return (await readCachedLocationSubDistrictUnits(districtId)) ?? [];
    }
  },

  async getElectoralAreas(input: {
    districtId?: string;
    subDistrictUnitId?: string;
  }): Promise<LocationElectoralArea[]> {
    const path = input.subDistrictUnitId
      ? `/locations/sub-district-units/${input.subDistrictUnitId}/electoral-areas`
      : input.districtId
        ? `/locations/districts/${input.districtId}/electoral-areas`
        : null;
    if (!path) {
      return [];
    }
    try {
      const payload = await apiClient.get<
        LocationCollectionResponse<LocationElectoralArea> | LocationElectoralArea[]
      >(path);
      const areas = unwrapCollection(payload);
      const cacheKey = input.subDistrictUnitId ?? input.districtId ?? '';
      void cacheLocationElectoralAreas(cacheKey, areas);
      return areas;
    } catch {
      const cacheKey = input.subDistrictUnitId ?? input.districtId ?? '';
      return (await readCachedLocationElectoralAreas(cacheKey)) ?? [];
    }
  },

  async getCommunitiesByElectoralArea(electoralAreaId: string): Promise<LocationCity[]> {
    try {
      const payload = await apiClient.get<LocationCollectionResponse<LocationCity> | LocationCity[]>(
        `/locations/electoral-areas/${electoralAreaId}/communities`,
      );
      const communities = unwrapCollection(payload);
      void cacheLocationCommunities(`ea:${electoralAreaId}`, communities);
      return communities;
    } catch {
      return (await readCachedLocationCommunities(`ea:${electoralAreaId}`)) ?? [];
    }
  },

  async getCities(districtId: string): Promise<LocationCity[]> {
    return this.getCommunities(districtId);
  },

  async search(query: string): Promise<LocationSearchResponse> {
    try {
      return await apiClient.get<LocationSearchResponse>(
        `/locations/search?q=${encodeURIComponent(query)}`,
      );
    } catch {
      const hierarchy = await readCachedLocationHierarchy();
      if (!hierarchy) {
        return {
          meta: { version: 'offline', source: 'offline', lastUpdated: null },
          data: { regions: [], districts: [], communities: [] },
        };
      }
      const normalized = query.trim().toLowerCase();
      return {
        meta: {
          version: hierarchy.version ?? 'offline',
          source: 'offline-cache',
          lastUpdated: null,
        },
        data: {
          regions: hierarchy.regions.filter((row) => row.name.toLowerCase().includes(normalized)),
          districts: hierarchy.districts.filter((row) => row.name.toLowerCase().includes(normalized)),
          communities: hierarchy.communities.filter((row) =>
            row.name.toLowerCase().includes(normalized),
          ),
        },
      };
    }
  },

  async autocomplete(
    query: string,
    limit = 12,
    options?: {
      types?: Array<'region' | 'district' | 'sub_district_unit' | 'electoral_area' | 'community'>;
      districtId?: string;
    },
  ) {
    const params = new URLSearchParams({
      q: query,
      limit: String(limit),
    });
    if (options?.types?.length) {
      params.set('types', options.types.join(','));
    }
    if (options?.districtId) {
      params.set('districtId', options.districtId);
    }
    try {
      return await apiClient.get<{
        meta: LocationResponseMeta;
        data: Array<{
          type: string;
          id: string;
          name: string;
          score?: number;
          districtId?: string | null;
          regionId?: string | null;
          aliases?: string[];
        }>;
      }>(`/locations/autocomplete?${params.toString()}`);
    } catch {
      const search = await this.search(query);
      const data = [
        ...search.data.regions.map((row) => ({ type: 'region', id: row.id, name: row.name })),
        ...search.data.districts.map((row) => ({
          type: 'district',
          id: row.id,
          name: row.name,
          regionId: row.regionId,
        })),
        ...search.data.communities.map((row) => ({
          type: 'community',
          id: row.id,
          name: row.name,
          districtId: row.districtId,
          aliases: row.aliases,
        })),
      ]
        .filter(
          (row) =>
            !options?.types?.length ||
            options.types.includes(row.type as (typeof options.types)[number]),
        )
        .filter((row) => {
          if (!options?.districtId) {
            return true;
          }
          if (row.type !== 'community') {
            return true;
          }
          return 'districtId' in row && row.districtId === options.districtId;
        })
        .slice(0, limit);
      return { meta: search.meta, data };
    }
  },

  async suggestCommunity(input: CommunitySuggestionInput): Promise<unknown> {
    return apiClient.post('/locations/community-suggestions', input);
  },

  async getSyncStatus(): Promise<LocationSyncStatusResponse> {
    return apiClient.get<LocationSyncStatusResponse>('/locations/sync/status');
  },

  async getCurrentLocation(): Promise<CurrentLocationResult> {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      return readBrowserGeolocation();
    }

    return apiClient.get<CurrentLocationResult>('/locations/current');
  },
};

export default locationService;
