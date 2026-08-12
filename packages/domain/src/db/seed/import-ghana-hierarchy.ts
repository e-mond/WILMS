import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import '../../config/load-env.js';
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

  const existingRegions = await locationMasterRepo.listAllRegions();
  const regionIdByCode = new Map<string, string>();
  for (const region of snapshot.regions) {
    const existing = existingRegions.find(
      (row) =>
        row.code.toUpperCase() === region.code.toUpperCase() ||
        normaliseMatchKey(row.name) === normaliseMatchKey(region.name),
    );
    const id = existing?.id ?? buildStableLocationId(snapshot.source, region.sourceId);
    regionIdByCode.set(region.code, id);
    const payload = {
      id,
      name: region.name,
      code: region.code,
      source: snapshot.source,
      sourceId: region.sourceId,
      datasetVersion: snapshot.datasetVersion,
      isActive: true,
    };
    if (existing) {
      await locationMasterRepo.updateRegionById(payload);
    } else {
      await locationMasterRepo.upsertRegion(payload);
    }
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
  const pendingAliases: Array<{
    id: string;
    entityType: string;
    entityId: string;
    alias: string;
    normalisedAlias: string;
    source: string;
    datasetVersion: string;
    isActive: boolean;
  }> = [];

  function queueAliases(
    entityId: string,
    names: string[],
    source: string,
    datasetVersion: string,
  ): void {
    const unique = new Map<string, string>();
    for (const name of names) {
      const normalised = normaliseLocationQuery(name);
      if (!normalised) {
        continue;
      }
      unique.set(normalised, name);
    }
    for (const [normalisedAlias, alias] of unique) {
      pendingAliases.push({
        id: buildStableLocationId(source, `alias:community:${entityId}:${normalisedAlias}`),
        entityType: 'community',
        entityId,
        alias,
        normalisedAlias,
        source,
        datasetVersion,
        isActive: true,
      });
    }
  }

  async function flushAliases(): Promise<void> {
    if (pendingAliases.length === 0) {
      return;
    }
    const rows = pendingAliases.splice(0, pendingAliases.length);
    await locationMasterRepo.upsertLocationAliasesBatch(rows);
    aliasesImported += rows.length;
  }

  const existingCommunities = await locationMasterRepo.listAllCommunities();
  const communityIdByDistrictName = new Map<string, string>();
  for (const row of existingCommunities) {
    communityIdByDistrictName.set(`${row.districtId}:${normaliseMatchKey(row.name)}`, row.id);
  }

  const pendingCommunities: Array<
    Omit<Awaited<ReturnType<typeof locationMasterRepo.listAllCommunities>>[number], 'createdAt' | 'updatedAt'>
  > = [];

  function queueCommunity(input: {
    preferredId: string;
    districtId: string;
    electoralAreaId: string | null;
    name: string;
    aliases: string[];
    latitude: number | null;
    longitude: number | null;
    geometryRef: string | null;
    source: string;
    sourceId: string;
    datasetVersion: string;
  }): 'imported' | 'merged' {
    const key = `${input.districtId}:${normaliseMatchKey(input.name)}`;
    const existingId = communityIdByDistrictName.get(key);
    if (existingId) {
      queueAliases(existingId, input.aliases, input.source, input.datasetVersion);
      return 'merged';
    }
    const id = input.preferredId;
    communityIdByDistrictName.set(key, id);
    pendingCommunities.push({
      id,
      districtId: input.districtId,
      electoralAreaId: input.electoralAreaId,
      code: null,
      name: input.name,
      aliases: input.aliases,
      latitude: input.latitude,
      longitude: input.longitude,
      geometryRef: input.geometryRef,
      source: input.source,
      sourceId: input.sourceId,
      datasetVersion: input.datasetVersion,
      isActive: true,
    });
    queueAliases(id, input.aliases, input.source, input.datasetVersion);
    return 'imported';
  }

  async function flushCommunities(): Promise<void> {
    if (pendingCommunities.length === 0) {
      return;
    }
    const rows = pendingCommunities.splice(0, pendingCommunities.length);
    await locationMasterRepo.upsertCommunitiesBatch(rows);
  }

  for (const community of snapshot.communities) {
    const districtId = districtIdBySourceId.get(community.districtSourceId);
    if (!districtId) {
      continue;
    }
    queueCommunity({
      preferredId: buildStableLocationId(snapshot.source, community.sourceId),
      districtId,
      electoralAreaId: community.electoralAreaSourceId
        ? (electoralAreaIdBySourceId.get(community.electoralAreaSourceId) ?? null)
        : null,
      name: community.name,
      aliases: community.aliases ?? [],
      latitude: community.latitude ?? null,
      longitude: community.longitude ?? null,
      geometryRef: community.geometryRef ?? null,
      source: snapshot.source,
      sourceId: community.sourceId,
      datasetVersion: snapshot.datasetVersion,
    });
  }
  await flushCommunities();
  await flushAliases();

  const hotosm = loadHotosmCommunityDataset();
  let hotosmImported = 0;
  let hotosmMerged = 0;
  for (const [index, community] of hotosm.communities.entries()) {
    const districtId = districtIdBySourceId.get(community.districtSourceId);
    if (!districtId) {
      continue;
    }
    const result = queueCommunity({
      preferredId: buildStableLocationId('hotosm', community.sourceId),
      districtId,
      electoralAreaId: null,
      name: community.name,
      aliases: community.aliases ?? [],
      latitude: community.latitude ?? null,
      longitude: community.longitude ?? null,
      geometryRef: community.geometryRef ?? null,
      source: 'hotosm',
      sourceId: community.sourceId,
      datasetVersion: hotosm.datasetVersion,
    });
    if (result === 'merged') {
      hotosmMerged += 1;
    } else {
      hotosmImported += 1;
    }
    if ((index + 1) % 500 === 0) {
      await flushCommunities();
      await flushAliases();
      console.log(JSON.stringify({ progress: 'hotosm', processed: index + 1, hotosmImported, hotosmMerged }));
    }
  }
  await flushCommunities();
  await flushAliases();

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
  let bundledMerged = 0;
  for (const city of bundledCommunities) {
    const districtId = districtIdByLegacyCode.get(city.district_code);
    if (!districtId) {
      continue;
    }
    const result = queueCommunity({
      preferredId: buildStableLocationId(
        'bundled',
        `community:${city.district_code}:${city.name.toLowerCase()}`,
      ),
      districtId,
      electoralAreaId: null,
      name: city.name,
      aliases: [],
      latitude: null,
      longitude: null,
      geometryRef: null,
      source: city.source ?? 'bundled',
      sourceId: `community:${city.district_code}:${city.name.toLowerCase()}`,
      datasetVersion: snapshot.datasetVersion,
    });
    if (result === 'merged') {
      bundledMerged += 1;
    } else {
      bundledImported += 1;
    }
  }
  await flushCommunities();
  await flushAliases();

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
      'Community completion import: IMCCOD capitals, STMA verified communities, HOTOSM named places matched to MMDAs, and bundled fallback communities. Duplicate district+name rows merge aliases onto the first verified community.',
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
        hotosmMergedIntoExisting: hotosmMerged,
        bundledCommunitiesPreserved: bundledImported,
        bundledMergedIntoExisting: bundledMerged,
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
