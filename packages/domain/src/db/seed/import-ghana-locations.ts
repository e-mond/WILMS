import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import '../../config/load-env.js';
import { isDatabaseEnabled } from '../client.js';
import * as locationMasterRepo from '../../repositories/location-master.repository.js';
import { buildStableLocationId } from '../../modules/locations/service.js';

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
  const datasetSource = process.env.WILMS_LOCATION_DATASET_SOURCE?.trim() || 'geoBoundaries';
  const datasetVersion = process.env.WILMS_LOCATION_DATASET_VERSION?.trim() || '2026-07-04';
  const syncId = randomUUID();

  const regionIdByCode = new Map<string, string>();
  for (const region of regions) {
    const id = buildStableLocationId(datasetSource, `region:${region.code}`);
    regionIdByCode.set(region.code, id);
    await locationMasterRepo.upsertRegion({
      id,
      name: region.name,
      code: region.code,
      source: datasetSource,
      sourceId: `region:${region.code}`,
      datasetVersion,
      isActive: true,
    });
  }

  const districtIdByCode = new Map<string, string>();
  for (const district of districts) {
    const regionId = regionIdByCode.get(district.region_code);
    if (!regionId) {
      console.warn(`Skipping district ${district.name}: unknown region ${district.region_code}`);
      continue;
    }

    const id = buildStableLocationId(datasetSource, `district:${district.code}`);
    districtIdByCode.set(district.code, id);
    await locationMasterRepo.upsertDistrict({
      id,
      regionId,
      name: district.name,
      category: district.type,
      code: district.code,
      source: datasetSource,
      sourceId: `district:${district.code}`,
      datasetVersion,
      isActive: true,
    });
  }

  for (const city of cities) {
    const districtId = districtIdByCode.get(city.district_code);
    if (!districtId) {
      console.warn(`Skipping city ${city.name}: unknown district ${city.district_code}`);
      continue;
    }

    await locationMasterRepo.upsertCommunity({
      id: buildStableLocationId(datasetSource, `community:${city.district_code}:${city.name.toLowerCase()}`),
      districtId,
      code: null,
      name: city.name,
      aliases: [],
      latitude: null,
      longitude: null,
      source: city.source ?? 'official',
      sourceId: `community:${city.district_code}:${city.name.toLowerCase()}`,
      datasetVersion,
      isActive: true,
    });
  }

  await locationMasterRepo.logLocationSync({
    id: syncId,
    datasetSource,
    datasetVersion,
    regionsImported: regions.length,
    districtsImported: districts.length,
    communitiesImported: cities.length,
    status: 'SUCCESS',
    notes:
      'Imported bundled Ghana location seed into the canonical location master. Community aliases and coordinates were unavailable in the source bundle.',
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        datasetSource,
        datasetVersion,
        regions: regions.length,
        districts: districts.length,
        communities: cities.length,
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
