import { describe, expect, it } from 'vitest';
import { GHANA_REGIONS } from '@/constants/borrower-registration';
import {
  getGhanaCities,
  getGhanaDistricts,
  getGhanaRegions,
} from '@/services/mock/factories/ghana-locations.factory';

describe('ghana-locations.factory', () => {
  it('builds stable region ids from region names', () => {
    const regions = getGhanaRegions();
    const greaterAccra = regions.find((region) => region.name === 'Greater Accra');

    expect(regions).toHaveLength(GHANA_REGIONS.length);
    expect(greaterAccra?.id).toBe('greater-accra');
  });

  it('scopes districts to their parent region', () => {
    const region = getGhanaRegions().find((entry) => entry.name === 'Greater Accra')!;

    const districts = getGhanaDistricts(region.id);

    expect(districts.length).toBeGreaterThan(0);
    expect(districts.every((district) => district.regionId === region.id)).toBe(true);
    expect(getGhanaDistricts('unknown-region')).toEqual([]);
  });

  it('scopes cities to their parent district', () => {
    const region = getGhanaRegions()[0]!;
    const district = getGhanaDistricts(region.id)[0]!;

    const cities = getGhanaCities(district.id);

    expect(cities.length).toBeGreaterThan(0);
    expect(cities.every((city) => city.districtId === district.id)).toBe(true);
    expect(getGhanaCities('unknown-district')).toEqual([]);
  });
});
