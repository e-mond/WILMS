import type {
  CommunitySuggestionInput,
  CurrentLocationResult,
  LocationCity,
  LocationCollectionResponse,
  LocationDistrict,
  LocationRegion,
  LocationSearchResponse,
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
  cacheLocationRegions,
  readCachedLocationCommunities,
  readCachedLocationDistricts,
  readCachedLocationRegions,
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

  async getCities(districtId: string): Promise<LocationCity[]> {
    return this.getCommunities(districtId);
  },

  async search(query: string): Promise<LocationSearchResponse> {
    return apiClient.get<LocationSearchResponse>(`/locations/search?q=${encodeURIComponent(query)}`);
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
