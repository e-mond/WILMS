import type { CurrentLocationResult, LocationCity, LocationDistrict, LocationRegion } from '@/types/location';
import type { ILocationService } from '@/types/services';
import { apiClient } from '@/utils/apiClient';
import {
  getGhanaCities,
  getGhanaDistricts,
  getGhanaRegions,
} from '@/services/mock/factories/ghana-locations.factory';

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

const locationService: ILocationService = {
  async getRegions(): Promise<LocationRegion[]> {
    try {
      return await apiClient.get<LocationRegion[]>('/locations/regions');
    } catch {
      return getGhanaRegions();
    }
  },

  async getDistricts(regionId: string): Promise<LocationDistrict[]> {
    try {
      return await apiClient.get<LocationDistrict[]>(`/locations/regions/${regionId}/districts`);
    } catch {
      return getGhanaDistricts(regionId);
    }
  },

  async getCities(districtId: string): Promise<LocationCity[]> {
    try {
      return await apiClient.get<LocationCity[]>(`/locations/districts/${districtId}/cities`);
    } catch {
      return getGhanaCities(districtId);
    }
  },

  async getCurrentLocation(): Promise<CurrentLocationResult> {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      return readBrowserGeolocation();
    }

    return apiClient.get<CurrentLocationResult>('/locations/current');
  },
};

export default locationService;
