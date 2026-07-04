import regionsSeed from '../../../../../../data/ghana-locations/regions.json';
import districtsSeed from '../../../../../../data/ghana-locations/districts.json';
import citiesSeed from '../../../../../../data/ghana-locations/cities.json';
import type { LocationCity, LocationDistrict, LocationRegion } from '@/types/location';

interface SeedRegion {
  code: string;
  name: string;
}

interface SeedDistrict {
  region_code: string;
  name: string;
  type: string;
  code: string;
}

interface SeedCity {
  district_code: string;
  name: string;
  source?: string;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

let cachedRegions: LocationRegion[] | null = null;
let cachedDistricts: LocationDistrict[] | null = null;
let cachedCities: LocationCity[] | null = null;

function ensureCache(): void {
  if (cachedRegions && cachedDistricts && cachedCities) {
    return;
  }

  const regionIdByCode = new Map<string, string>();
  cachedRegions = (regionsSeed as SeedRegion[]).map((region) => {
    const id = slugify(region.name);
    regionIdByCode.set(region.code, id);
    return { id, name: region.name };
  });

  const districtIdByCode = new Map<string, string>();
  cachedDistricts = (districtsSeed as SeedDistrict[]).map((district) => {
    const id = slugify(`${district.region_code}-${district.code}`);
    districtIdByCode.set(district.code, id);
    return {
      id,
      regionId: regionIdByCode.get(district.region_code) ?? slugify(district.region_code),
      name: district.name,
    };
  });

  cachedCities = (citiesSeed as SeedCity[]).map((city) => ({
    id: slugify(`${city.district_code}-${city.name}`),
    districtId: districtIdByCode.get(city.district_code) ?? slugify(city.district_code),
    name: city.name,
  }));
}

export function getGhanaRegions(): LocationRegion[] {
  ensureCache();
  return cachedRegions!.map((entry) => ({ ...entry }));
}

export function getGhanaDistricts(regionId: string): LocationDistrict[] {
  ensureCache();
  return cachedDistricts!.filter((entry) => entry.regionId === regionId).map((entry) => ({ ...entry }));
}

export function getGhanaCities(districtId: string): LocationCity[] {
  ensureCache();
  return cachedCities!.filter((entry) => entry.districtId === districtId).map((entry) => ({ ...entry }));
}

export function findRegionByName(name: string): LocationRegion | undefined {
  ensureCache();
  return cachedRegions!.find((entry) => entry.name === name);
}

export function findDistrictByName(regionId: string, name: string): LocationDistrict | undefined {
  return getGhanaDistricts(regionId).find((entry) => entry.name === name);
}

export const DEMO_CURRENT_LOCATION = {
  latitude: 5.6037,
  longitude: -0.187,
  address: 'GA-123-4567',
} as const;
