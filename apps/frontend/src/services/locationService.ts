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
  getRegions(): Promise<LocationRegion[]> {
    return Promise.resolve(getGhanaRegions());
  },

  getDistricts(regionId: string): Promise<LocationDistrict[]> {
    return Promise.resolve(getGhanaDistricts(regionId));
  },

  getCities(districtId: string): Promise<LocationCity[]> {
    return Promise.resolve(getGhanaCities(districtId));
  },

  async getCurrentLocation(): Promise<CurrentLocationResult> {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      return readBrowserGeolocation();
    }

    return apiClient.get<CurrentLocationResult>('/locations/current');
  },
};

export default locationService;
