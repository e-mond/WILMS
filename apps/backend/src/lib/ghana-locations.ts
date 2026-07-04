export const GHANA_REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Central',
  'Eastern',
  'Northern',
  'Volta',
  'Upper East',
  'Upper West',
  'Bono',
  'Bono East',
  'Ahafo',
  'Western North',
  'Oti',
  'North East',
  'Savannah',
] as const;

export interface LocationRegion {
  id: string;
  name: string;
}

export interface LocationDistrict {
  id: string;
  regionId: string;
  name: string;
}

export interface LocationCity {
  id: string;
  districtId: string;
  name: string;
}

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

export function searchGhanaLocations(query: string, limit = 20) {
  ensureCache();
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  const matches = [
    ...cachedRegions!.map((entry) => ({ type: 'region' as const, ...entry })),
    ...cachedDistricts!.map((entry) => ({ type: 'district' as const, ...entry })),
    ...cachedCities!.map((entry) => ({ type: 'city' as const, ...entry })),
  ].filter((entry) => entry.name.toLowerCase().includes(normalized));

  return matches.slice(0, limit);
}
