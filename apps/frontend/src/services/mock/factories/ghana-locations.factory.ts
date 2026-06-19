import { GHANA_REGIONS } from '@/constants/borrower-registration';
import type { LocationCity, LocationDistrict, LocationRegion } from '@/types/location';

const DISTRICT_SUFFIXES = ['Municipal', 'District', 'Metropolitan'] as const;
const CITY_NAMES = ['Central', 'North', 'South', 'East', 'West', 'Market', 'Station'] as const;

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function buildDistrictsForRegion(region: LocationRegion): LocationDistrict[] {
  return DISTRICT_SUFFIXES.slice(0, 2).map((suffix, index) => ({
    id: `${region.id}-district-${index + 1}`,
    regionId: region.id,
    name: `${region.name} ${suffix}`,
  }));
}

function buildCitiesForDistrict(district: LocationDistrict): LocationCity[] {
  return CITY_NAMES.slice(0, 3).map((cityName, index) => ({
    id: `${district.id}-city-${index + 1}`,
    districtId: district.id,
    name: `${district.name.replace(/ (Municipal|District|Metropolitan)$/, '')} ${cityName}`,
  }));
}

let cachedRegions: LocationRegion[] | null = null;
let cachedDistricts: LocationDistrict[] | null = null;
let cachedCities: LocationCity[] | null = null;

function ensureCache(): void {
  if (cachedRegions && cachedDistricts && cachedCities) {
    return;
  }

  cachedRegions = GHANA_REGIONS.map((name) => ({
    id: slugify(name),
    name,
  }));

  cachedDistricts = cachedRegions.flatMap((region) => buildDistrictsForRegion(region));
  cachedCities = cachedDistricts.flatMap((district) => buildCitiesForDistrict(district));
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
