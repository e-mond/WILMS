import { describe, expect, it } from 'vitest';
import { GHANA_REGIONS } from '@/constants/borrower-registration';
import {
  DEMO_CURRENT_LOCATION,
  getGhanaDistricts,
  getGhanaRegions,
} from '@/services/mock/factories/ghana-locations.factory';
import locationServiceMock from '@/services/mock/locationService.mock';

describe('locationService.mock', () => {
  it('returns all Ghana regions', async () => {
    const regions = await locationServiceMock.getRegions();

    expect(regions).toHaveLength(GHANA_REGIONS.length);
    expect(regions.map((region) => region.name)).toEqual(expect.arrayContaining([GHANA_REGIONS[0]]));
  });

  it('returns districts scoped to the selected region', async () => {
    const regions = getGhanaRegions();
    const region = regions[0]!;

    const districts = await locationServiceMock.getDistricts(region.id);

    expect(districts.length).toBeGreaterThan(0);
    expect(districts.every((district) => district.regionId === region.id)).toBe(true);
  });

  it('returns cities scoped to the selected district', async () => {
    const region = getGhanaRegions()[0]!;
    const district = getGhanaDistricts(region.id)[0]!;

    const cities = await locationServiceMock.getCities(district.id);

    expect(cities.length).toBeGreaterThan(0);
    expect(cities.every((city) => city.districtId === district.id)).toBe(true);
  });

  it('returns demo coordinates in mock mode', async () => {
    const location = await locationServiceMock.getCurrentLocation();

    expect(location).toEqual(DEMO_CURRENT_LOCATION);
  });
});
