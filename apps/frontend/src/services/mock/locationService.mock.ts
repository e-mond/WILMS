import { isDemoMode } from '@/data-provider/types';
import {
  DEMO_CURRENT_LOCATION,
  getGhanaCities,
  getGhanaDistricts,
  getGhanaRegions,
} from '@/services/mock/factories/ghana-locations.factory';
import { simulateDelay } from '@/services/mock/delay';
import type {
  CommunitySuggestionInput,
  CurrentLocationResult,
  LocationCity,
  LocationDistrict,
  LocationRegion,
  LocationSearchResponse,
  LocationSyncStatusResponse,
} from '@/types/location';
import type { ILocationService } from '@/types/services';

const locationServiceMock: ILocationService = {
  async getRegions(): Promise<LocationRegion[]> {
    await simulateDelay();
    return getGhanaRegions();
  },

  async getDistricts(regionId: string): Promise<LocationDistrict[]> {
    await simulateDelay();
    return getGhanaDistricts(regionId);
  },

  async getCommunities(districtId: string): Promise<LocationCity[]> {
    await simulateDelay();
    return getGhanaCities(districtId);
  },

  async getCities(districtId: string): Promise<LocationCity[]> {
    return this.getCommunities(districtId);
  },

  async search(query: string): Promise<LocationSearchResponse> {
    await simulateDelay();
    const normalized = query.trim().toLowerCase();
    const regions = getGhanaRegions().filter((region) => region.name.toLowerCase().includes(normalized));
    const districts = getGhanaRegions().flatMap((region) =>
      getGhanaDistricts(region.id).filter((district) => district.name.toLowerCase().includes(normalized)),
    );
    const communities = districts.flatMap((district) =>
      getGhanaCities(district.id).filter((community) => community.name.toLowerCase().includes(normalized)),
    );
    return {
      meta: { version: 'mock', source: 'mock', lastUpdated: null },
      data: { regions, districts, communities },
    };
  },

  async suggestCommunity(input: CommunitySuggestionInput): Promise<unknown> {
    await simulateDelay();
    return {
      id: `suggestion-${Date.now()}`,
      districtId: input.districtId ?? null,
      proposedName: input.proposedName,
      status: 'PENDING',
    };
  },

  async getSyncStatus(): Promise<LocationSyncStatusResponse> {
    await simulateDelay();
    return {
      meta: { version: 'mock', source: 'mock', lastUpdated: null },
      data: null,
    };
  },

  async getCurrentLocation(): Promise<CurrentLocationResult> {
    await simulateDelay();

    if (isDemoMode()) {
      return { ...DEMO_CURRENT_LOCATION };
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      throw new Error('Location services are unavailable on this device.');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            reject(new Error('Location permission was denied. Enter your GPS address manually.'));
            return;
          }

          reject(new Error('Unable to determine your current location. Try again or enter it manually.'));
        },
        {
          enableHighAccuracy: true,
          timeout: 10_000,
          maximumAge: 60_000,
        },
      );
    });
  },
};

export default locationServiceMock;
