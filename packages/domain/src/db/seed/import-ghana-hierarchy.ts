import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import '../../../config/load-env.js';
import { isDatabaseEnabled } from '../client.js';
import * as locationMasterRepo from '../../repositories/location-master.repository.js';
import { buildStableLocationId } from '../../modules/locations/service.js';
import { loadHotosmCommunityDataset } from '../../../../../scripts/location-sync/adapters/gss.js';
import { loadValidatedSnapshot } from '../../../../../scripts/location-sync/pipeline.js';
import { normaliseMatchKey } from '../../../../../scripts/location-sync/normalize.js';
import { normaliseLocationQuery } from '../../modules/locations/alias-resolution.js';

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
    console.error('DATABASE_URL is required to import the Ghana administrative hierarchy.');
    process.exit(1);
  }

  const snapshot = await loadValidatedSnapshot(process.env.WILMS_LOCATION_ADAPTER);
  const bundledCommunities = readJson<SeedCity[]>('cities.json');
  const syncId = randomUUID();

  const regionIdByCode = new Map<string, string>();
  for (const region of snapshot.regions) {
    const id = buildStableLocationId(snapshot.source, region.sourceId);
    regionIdByCode.set(region.code, id);
    await locationMasterRepo.upsertRegion({
      id,
      name: region.name,
      code: region.code,
      source: snapshot.source,
      sourceId: region.sourceId,
      datasetVersion: snapshot.datasetVersion,
      isActive: true,
    });
  }

  const existingDistricts = await locationMasterRepo.listAllDistricts();
  const districtIdBySourceId = new Map<string, string>();

  for (const district of snapshot.districts) {
    const regionId = regionIdByCode.get(district.regionCode);
    if (!regionId) {
      continue;
    }

    const matchKey = normaliseMatchKey(district.name);
    const existing = existingDistricts.find(
      (row) => row.regionId === regionId && normaliseMatchKey(row.name) === matchKey,
    );
    const id = existing?.id ?? buildStableLocationId(snapshot.source, district.sourceId);
    districtIdBySourceId.set(district.sourceId, id);

    const payload = {
      id,
      regionId,
      name: existing?.name ?? district.name,
      category: district.category,
      code: existing?.code ?? district.sourceId,
      source: snapshot.source,
      sourceId: district.sourceId,
      datasetVersion: snapshot.datasetVersion,
      isActive: true,
    };
    if (existing) {
      await locationMasterRepo.updateDistrictById(payload);
    } else {
      await locationMasterRepo.upsertDistrict(payload);
    }
  }

  const subUnitIdBySourceId = new Map<string, string>();
  for (const unit of snapshot.subDistrictUnits) {
    const districtId = districtIdBySourceId.get(unit.districtSourceId);
    if (!districtId) {
      continue;
    }
    const id = buildStableLocationId(snapshot.source, unit.sourceId);
    subUnitIdBySourceId.set(unit.sourceId, id);
    await locationMasterRepo.upsertSubDistrictUnit({
      id,
      districtId,
      code: unit.sourceId,
      name: unit.name,
      unitType: unit.unitType,
      source: snapshot.source,
      sourceId: unit.sourceId,
      datasetVersion: snapshot.datasetVersion,
      isActive: true,
    });
  }

  const electoralAreaIdBySourceId = new Map<string, string>();
  for (const area of snapshot.electoralAreas) {
    const districtId = districtIdBySourceId.get(area.districtSourceId);
    if (!districtId) {
      continue;
    }
    const id = buildStableLocationId(snapshot.source, area.sourceId);
    electoralAreaIdBySourceId.set(area.sourceId, id);
    await locationMasterRepo.upsertElectoralArea({
      id,
      districtId,
      subDistrictUnitId: area.subDistrictUnitSourceId
        ? (subUnitIdBySourceId.get(area.subDistrictUnitSourceId) ?? null)
        : null,
      code: area.sourceId,
      name: area.name,
      source: snapshot.source,
      sourceId: area.sourceId,
      datasetVersion: snapshot.datasetVersion,
      isActive: true,
    });
  }

  let aliasesImported = 0;
  async function seedAliases(
    entityId: string,
    names: string[],
    source: string,
    datasetVersion: string,
  ): Promise<void> {
    const unique = new Map<string, string>();
    for (const name of names) {
      const normalised = normaliseLocationQuery(name);
      if (!normalised) {
        continue;
      }
      unique.set(normalised, name);
    }
    for (const [normalisedAlias, alias] of unique) {
      await locationMasterRepo.upsertLocationAlias({
        id: buildStableLocationId(source, `alias:community:${entityId}:${normalisedAlias}`),
        entityType: 'community',
        entityId,
        alias,
        normalisedAlias,
        source,
        datasetVersion,
        isActive: true,
      });
      aliasesImported += 1;
    }
  }

  for (const community of snapshot.communities) {
    const districtId = districtIdBySourceId.get(community.districtSourceId);
    if (!districtId) {
      continue;
    }
    const communityId = buildStableLocationId(snapshot.source, community.sourceId);
    await locationMasterRepo.upsertCommunity({
      id: communityId,
      districtId,
      electoralAreaId: community.electoralAreaSourceId
        ? (electoralAreaIdBySourceId.get(community.electoralAreaSourceId) ?? null)
        : null,
      code: null,
      name: community.name,
      aliases: community.aliases ?? [],
      latitude: community.latitude ?? null,
      longitude: community.longitude ?? null,
      geometryRef: community.geometryRef ?? null,
      source: snapshot.source,
      sourceId: community.sourceId,
      datasetVersion: snapshot.datasetVersion,
      isActive: true,
    });
    await seedAliases(
      communityId,
      [community.name, ...(community.aliases ?? [])],
      snapshot.source,
      snapshot.datasetVersion,
    );
  }

  const hotosm = loadHotosmCommunityDataset();
  let hotosmImported = 0;
  for (const community of hotosm.communities) {
    const districtId = districtIdBySourceId.get(community.districtSourceId);
    if (!districtId) {
      continue;
    }
    const communityId = buildStableLocationId('hotosm', community.sourceId);
    await locationMasterRepo.upsertCommunity({
      id: communityId,
      districtId,
      electoralAreaId: null,
      code: null,
      name: community.name,
      aliases: community.aliases ?? [],
      latitude: community.latitude ?? null,
      longitude: community.longitude ?? null,
      geometryRef: community.geometryRef ?? null,
      source: 'hotosm',
      sourceId: community.sourceId,
      datasetVersion: hotosm.datasetVersion,
      isActive: true,
    });
    await seedAliases(
      communityId,
      [community.name, ...(community.aliases ?? [])],
      'hotosm',
      hotosm.datasetVersion,
    );
    hotosmImported += 1;
  }

  const existingDistrictsAfterImport = await locationMasterRepo.listAllDistricts();
  const districtIdByLegacyCode = new Map<string, string>();
  const districtsSeed = readJson<Array<{ code: string; name: string; region_code: string }>>('districts.json');
  for (const row of districtsSeed) {
    const regionId = regionIdByCode.get(row.region_code);
    if (!regionId) {
      continue;
    }
    const matchKey = normaliseMatchKey(row.name);
    const existing = existingDistrictsAfterImport.find(
      (district) => district.regionId === regionId && normaliseMatchKey(district.name) === matchKey,
    );
    if (existing) {
      districtIdByLegacyCode.set(row.code, existing.id);
    }
  }

  let bundledImported = 0;
  for (const city of bundledCommunities) {
    const districtId = districtIdByLegacyCode.get(city.district_code);
    if (!districtId) {
      continue;
    }
    await locationMasterRepo.upsertCommunity({
      id: buildStableLocationId('bundled', `community:${city.district_code}:${city.name.toLowerCase()}`),
      districtId,
      electoralAreaId: null,
      code: null,
      name: city.name,
      aliases: [],
      latitude: null,
      longitude: null,
      geometryRef: null,
      source: city.source ?? 'bundled',
      sourceId: `community:${city.district_code}:${city.name.toLowerCase()}`,
      datasetVersion: snapshot.datasetVersion,
      isActive: true,
    });
    bundledImported += 1;
  }

  await locationMasterRepo.logLocationSync({
    id: syncId,
    datasetSource: `${snapshot.source}+hotosm`,
    datasetVersion: `${snapshot.datasetVersion}+${hotosm.datasetVersion}`,
    checksum: snapshot.checksum,
    regionsImported: snapshot.regions.length,
    districtsImported: snapshot.districts.length,
    subDistrictUnitsImported: snapshot.subDistrictUnits.length,
    electoralAreasImported: snapshot.electoralAreas.length,
    communitiesImported: snapshot.communities.length + bundledImported + hotosmImported,
    aliasesImported,
    status: 'SUCCESS',
    notes:
      'Imported 16 regions, 261 MMDAs (IMCCOD), STMA hierarchy, IMCCOD capitals, HOTOSM named places matched to MMDAs, and preserved bundled communities. Sub-district/electoral coverage outside STMA remains empty until a national gazetteer is licensed.',
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        adapter: snapshot.source,
        datasetVersion: snapshot.datasetVersion,
        checksum: snapshot.checksum,
        regions: snapshot.regions.length,
        districts: snapshot.districts.length,
        subDistrictUnits: snapshot.subDistrictUnits.length,
        electoralAreas: snapshot.electoralAreas.length,
        verifiedCommunities: snapshot.communities.length,
        hotosmCommunities: hotosmImported,
        bundledCommunitiesPreserved: bundledImported,
        aliasesImported,
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
