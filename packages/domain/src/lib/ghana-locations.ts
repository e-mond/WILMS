import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDatabaseEnabled } from '../db/client.js';
import * as ghanaLocationsRepo from '../repositories/ghana-locations.repository.js';

export interface LocationRegion {
  id: string;
  name: string;
}

export interface LocationDistrict {
  id: string;
  regionId: string;
  name: string;
  type?: string;
}

export interface LocationCity {
  id: string;
  districtId: string;
  name: string;
  source?: string;
}

interface SeedRegion {
  code: string;
  name: string;
}

interface SeedDistrict {
  region_code: string;
  name: string;
  type: 'District' | 'Municipal' | 'Metropolitan';
  code: string;
}

interface SeedCity {
  district_code: string;
  name: string;
  source?: string;
}

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../../../data/ghana-locations');

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function readSeedJson<T>(filename: string): T {
  return JSON.parse(readFileSync(join(DATA_DIR, filename), 'utf8')) as T;
}

let bundledCache:
  | {
      regions: LocationRegion[];
      districts: LocationDistrict[];
      cities: LocationCity[];
    }
  | null = null;

function loadBundledLocations(): {
  regions: LocationRegion[];
  districts: LocationDistrict[];
  cities: LocationCity[];
} {
  if (bundledCache) {
    return bundledCache;
  }

  const seedRegions = readSeedJson<SeedRegion[]>('regions.json');
  const seedDistricts = readSeedJson<SeedDistrict[]>('districts.json');
  const seedCities = readSeedJson<SeedCity[]>('cities.json');

  const regionIdByCode = new Map<string, string>();
  const regions: LocationRegion[] = seedRegions.map((region) => {
    const id = slugify(region.name);
    regionIdByCode.set(region.code, id);
    return { id, name: region.name };
  });

  const districtIdByCode = new Map<string, string>();
  const districts: LocationDistrict[] = seedDistricts.map((district) => {
    const id = slugify(`${district.region_code}-${district.code}`);
    districtIdByCode.set(district.code, id);
    return {
      id,
      regionId: regionIdByCode.get(district.region_code) ?? slugify(district.region_code),
      name: district.name,
      type: district.type,
    };
  });

  const cities: LocationCity[] = seedCities.map((city) => ({
    id: slugify(`${city.district_code}-${city.name}`),
    districtId: districtIdByCode.get(city.district_code) ?? slugify(city.district_code),
    name: city.name,
    source: city.source ?? 'official',
  }));

  bundledCache = { regions, districts, cities };
  return bundledCache;
}

async function loadDbRegions(): Promise<LocationRegion[] | null> {
  if (!isDatabaseEnabled()) {
    return null;
  }

  try {
    const count = await ghanaLocationsRepo.countRegions();
    if (count === 0) {
      return null;
    }

    const rows = await ghanaLocationsRepo.listRegions();
    return rows.map((row) => ({ id: row.id, name: row.name }));
  } catch {
    return null;
  }
}

export async function getGhanaRegions(): Promise<LocationRegion[]> {
  const dbRegions = await loadDbRegions();
  if (dbRegions) {
    return dbRegions;
  }

  return loadBundledLocations().regions.map((entry) => ({ ...entry }));
}

export async function getGhanaDistricts(regionId: string): Promise<LocationDistrict[]> {
  if (isDatabaseEnabled()) {
    try {
      const count = await ghanaLocationsRepo.countRegions();
      if (count > 0) {
        const rows = await ghanaLocationsRepo.listDistrictsByRegionId(regionId);
        return rows.map((row) => ({
          id: row.id,
          regionId: row.regionId,
          name: row.name,
          type: row.type,
        }));
      }
    } catch {
      // fall through to bundled data
    }
  }

  return loadBundledLocations()
    .districts.filter((district) => district.regionId === regionId)
    .map((entry) => ({ ...entry }));
}

export async function getGhanaCities(districtId: string): Promise<LocationCity[]> {
  if (isDatabaseEnabled()) {
    try {
      const count = await ghanaLocationsRepo.countRegions();
      if (count > 0) {
        const rows = await ghanaLocationsRepo.listCitiesByDistrictId(districtId);
        return rows.map((row) => ({
          id: row.id,
          districtId: row.districtId,
          name: row.name,
          source: row.source,
        }));
      }
    } catch {
      // fall through to bundled data
    }
  }

  return loadBundledLocations()
    .cities.filter((city) => city.districtId === districtId)
    .map((entry) => ({ ...entry }));
}

export async function searchGhanaLocations(query: string): Promise<{
  regions: LocationRegion[];
  districts: LocationDistrict[];
  cities: LocationCity[];
}> {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return { regions: [], districts: [], cities: [] };
  }

  const bundled = loadBundledLocations();
  const regions = (await getGhanaRegions()).filter((region) =>
    region.name.toLowerCase().includes(normalized),
  );
  const districts = bundled.districts.filter((district) =>
    district.name.toLowerCase().includes(normalized),
  );
  const cities = bundled.cities.filter((city) => city.name.toLowerCase().includes(normalized));

  return { regions, districts, cities };
}

/** @deprecated Use async getGhanaRegions instead. */
export function getGhanaRegionsSync(): LocationRegion[] {
  return loadBundledLocations().regions.map((entry) => ({ ...entry }));
}
