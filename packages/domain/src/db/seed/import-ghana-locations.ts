import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { uuidv7 } from 'uuidv7';
import '../../config/load-env.js';
import { isDatabaseEnabled } from '../client.js';
import * as ghanaLocationsRepo from '../../repositories/ghana-locations.repository.js';

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

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../../../../data/ghana-locations');

function readJson<T>(filename: string): T {
  return JSON.parse(readFileSync(join(DATA_DIR, filename), 'utf8')) as T;
}

async function main(): Promise<void> {
  if (!isDatabaseEnabled()) {
    console.error('DATABASE_URL is required to import Ghana locations.');
    process.exit(1);
  }

  const regions = readJson<SeedRegion[]>('regions.json');
  const districts = readJson<SeedDistrict[]>('districts.json');
  const cities = readJson<SeedCity[]>('cities.json');

  const regionIdByCode = new Map<string, string>();
  for (const region of regions) {
    const id = uuidv7();
    regionIdByCode.set(region.code, id);
    await ghanaLocationsRepo.upsertRegion({ id, name: region.name, code: region.code });
  }

  const districtIdByCode = new Map<string, string>();
  for (const district of districts) {
    const regionId = regionIdByCode.get(district.region_code);
    if (!regionId) {
      console.warn(`Skipping district ${district.name}: unknown region ${district.region_code}`);
      continue;
    }

    const id = uuidv7();
    districtIdByCode.set(district.code, id);
    await ghanaLocationsRepo.upsertDistrict({
      id,
      regionId,
      name: district.name,
      type: district.type,
      code: district.code,
    });
  }

  for (const city of cities) {
    const districtId = districtIdByCode.get(city.district_code);
    if (!districtId) {
      console.warn(`Skipping city ${city.name}: unknown district ${city.district_code}`);
      continue;
    }

    await ghanaLocationsRepo.upsertCity({
      id: uuidv7(),
      districtId,
      name: city.name,
      source: city.source ?? 'official',
    });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        regions: regions.length,
        districts: districts.length,
        cities: cities.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
