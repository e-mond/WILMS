import { isDemoMode } from '@/data-provider/types';
import {
  DEMO_CURRENT_LOCATION,
  getGhanaCities,
  getGhanaDistricts,
  getGhanaRegions,
} from '@/services/mock/factories/ghana-locations.factory';
import { simulateDelay } from '@/services/mock/delay';
import type { CurrentLocationResult, LocationCity, LocationDistrict, LocationRegion } from '@/types/location';
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

  async getCities(districtId: string): Promise<LocationCity[]> {
    await simulateDelay();
    return getGhanaCities(districtId);
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
