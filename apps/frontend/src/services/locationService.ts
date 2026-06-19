import type { CurrentLocationResult, LocationCity, LocationDistrict, LocationRegion } from '@/types/location';
import type { ILocationService } from '@/types/services';
import { apiClient } from '@/utils/apiClient';

const locationService: ILocationService = {
  getRegions(): Promise<LocationRegion[]> {
    return apiClient.get<LocationRegion[]>('/locations/regions');
  },

  getDistricts(regionId: string): Promise<LocationDistrict[]> {
    return apiClient.get<LocationDistrict[]>(`/locations/regions/${regionId}/districts`);
  },

  getCities(districtId: string): Promise<LocationCity[]> {
    return apiClient.get<LocationCity[]>(`/locations/districts/${districtId}/cities`);
  },

  getCurrentLocation(): Promise<CurrentLocationResult> {
    return apiClient.get<CurrentLocationResult>('/locations/current');
  },
};

export default locationService;
