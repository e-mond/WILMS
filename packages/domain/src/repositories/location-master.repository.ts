import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { getDb } from '../db/client.js';
import {
  communities,
  districts,
  electoralAreas,
  locationAliases,
  locationSyncLog,
  pendingCommunitySuggestions,
  regions,
  subDistrictUnits,
} from '../db/schema/index.js';
import { normaliseLocationQuery } from '../modules/locations/alias-resolution.js';

export interface RegionMasterRow {
  id: string;
  code: string;
  name: string;
  source: string;
  sourceId: string;
  datasetVersion: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DistrictMasterRow {
  id: string;
  regionId: string;
  code: string | null;
  name: string;
  category: string;
  source: string;
  sourceId: string;
  datasetVersion: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityMasterRow {
  id: string;
  districtId: string;
  electoralAreaId?: string | null;
  code: string | null;
  name: string;
  aliases: string[];
  latitude: number | null;
  longitude: number | null;
  geometryRef?: string | null;
  source: string;
  sourceId: string;
  datasetVersion: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubDistrictUnitRow {
  id: string;
  districtId: string;
  code: string | null;
  name: string;
  unitType: string;
  source: string;
  sourceId: string;
  datasetVersion: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ElectoralAreaRow {
  id: string;
  districtId: string;
  subDistrictUnitId: string | null;
  code: string | null;
  name: string;
  source: string;
  sourceId: string;
  datasetVersion: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function listRegions() {
  const db = getDb();
  return db.select().from(regions).where(eq(regions.isActive, true)).orderBy(asc(regions.name));
}

export async function listDistrictsByRegionId(regionId: string) {
  const db = getDb();
  return db
    .select()
    .from(districts)
    .where(and(eq(districts.regionId, regionId), eq(districts.isActive, true)))
    .orderBy(asc(districts.name));
}

export async function listCommunitiesByDistrictId(districtId: string) {
  const db = getDb();
  return db
    .select()
    .from(communities)
    .where(and(eq(communities.districtId, districtId), eq(communities.isActive, true)))
    .orderBy(asc(communities.name));
}

export async function listSubDistrictUnitsByDistrictId(districtId: string) {
  const db = getDb();
  return db
    .select()
    .from(subDistrictUnits)
    .where(and(eq(subDistrictUnits.districtId, districtId), eq(subDistrictUnits.isActive, true)))
    .orderBy(asc(subDistrictUnits.name));
}

export async function listElectoralAreasBySubDistrictUnitId(subDistrictUnitId: string) {
  const db = getDb();
  return db
    .select()
    .from(electoralAreas)
    .where(
      and(eq(electoralAreas.subDistrictUnitId, subDistrictUnitId), eq(electoralAreas.isActive, true)),
    )
    .orderBy(asc(electoralAreas.name));
}

export async function listElectoralAreasByDistrictId(districtId: string) {
  const db = getDb();
  return db
    .select()
    .from(electoralAreas)
    .where(and(eq(electoralAreas.districtId, districtId), eq(electoralAreas.isActive, true)))
    .orderBy(asc(electoralAreas.name));
}

export async function listCommunitiesByElectoralAreaId(electoralAreaId: string) {
  const db = getDb();
  return db
    .select()
    .from(communities)
    .where(and(eq(communities.electoralAreaId, electoralAreaId), eq(communities.isActive, true)))
    .orderBy(asc(communities.name));
}

export async function searchLocations(query: string, limit = 25) {
  const db = getDb();
  const trimmed = query.trim();
  const pattern = `%${trimmed}%`;
  const normalised = normaliseLocationQuery(trimmed);
  const aliasPredicate = sql<boolean>`exists (
    select 1
    from unnest(${communities.aliases}) as alias
    where alias ilike ${pattern}
  )`;

  const [regionRows, districtRows, communityRows, subUnitRows, electoralAreaRows] = await Promise.all([
    db
      .select({
        row: regions,
        score: sql<number>`greatest(
          similarity(${regions.name}, ${trimmed}),
          similarity(${regions.name}, ${normalised})
        )`,
      })
      .from(regions)
      .where(
        and(
          eq(regions.isActive, true),
          or(ilike(regions.name, pattern), sql`${regions.name} % ${trimmed}`),
        ),
      )
      .orderBy(sql`greatest(similarity(${regions.name}, ${trimmed}), similarity(${regions.name}, ${normalised})) desc`)
      .limit(limit),
    db
      .select({
        row: districts,
        score: sql<number>`greatest(
          similarity(${districts.name}, ${trimmed}),
          similarity(${districts.name}, ${normalised})
        )`,
      })
      .from(districts)
      .where(
        and(
          eq(districts.isActive, true),
          or(ilike(districts.name, pattern), sql`${districts.name} % ${trimmed}`),
        ),
      )
      .orderBy(
        sql`greatest(similarity(${districts.name}, ${trimmed}), similarity(${districts.name}, ${normalised})) desc`,
      )
      .limit(limit),
    db
      .select({
        row: communities,
        score: sql<number>`greatest(
          similarity(${communities.name}, ${trimmed}),
          similarity(${communities.name}, ${normalised})
        )`,
      })
      .from(communities)
      .where(
        and(
          eq(communities.isActive, true),
          or(
            ilike(communities.name, pattern),
            aliasPredicate,
            sql`${communities.name} % ${trimmed}`,
          ),
        ),
      )
      .orderBy(
        sql`greatest(similarity(${communities.name}, ${trimmed}), similarity(${communities.name}, ${normalised})) desc`,
      )
      .limit(limit),
    db
      .select({
        row: subDistrictUnits,
        score: sql<number>`similarity(${subDistrictUnits.name}, ${trimmed})`,
      })
      .from(subDistrictUnits)
      .where(
        and(
          eq(subDistrictUnits.isActive, true),
          or(ilike(subDistrictUnits.name, pattern), sql`${subDistrictUnits.name} % ${trimmed}`),
        ),
      )
      .orderBy(sql`similarity(${subDistrictUnits.name}, ${trimmed}) desc`)
      .limit(limit),
    db
      .select({
        row: electoralAreas,
        score: sql<number>`similarity(${electoralAreas.name}, ${trimmed})`,
      })
      .from(electoralAreas)
      .where(
        and(
          eq(electoralAreas.isActive, true),
          or(ilike(electoralAreas.name, pattern), sql`${electoralAreas.name} % ${trimmed}`),
        ),
      )
      .orderBy(sql`similarity(${electoralAreas.name}, ${trimmed}) desc`)
      .limit(limit),
  ]);

  return {
    regions: regionRows.map((entry) => entry.row),
    districts: districtRows.map((entry) => entry.row),
    communities: communityRows.map((entry) => entry.row),
    subDistrictUnits: subUnitRows.map((entry) => entry.row),
    electoralAreas: electoralAreaRows.map((entry) => entry.row),
    scores: {
      regions: regionRows.map((entry) => Number(entry.score ?? 0)),
      districts: districtRows.map((entry) => Number(entry.score ?? 0)),
      communities: communityRows.map((entry) => Number(entry.score ?? 0)),
      subDistrictUnits: subUnitRows.map((entry) => Number(entry.score ?? 0)),
      electoralAreas: electoralAreaRows.map((entry) => Number(entry.score ?? 0)),
    },
  };
}

export async function searchLocationsRanked(
  query: string,
  limit = 20,
  options?: {
    types?: Array<'region' | 'district' | 'sub_district_unit' | 'electoral_area' | 'community'>;
    districtId?: string;
  },
) {
  const result = await searchLocations(query, Math.max(limit * 3, 40));
  const ranked: Array<{
    type: 'region' | 'district' | 'sub_district_unit' | 'electoral_area' | 'community';
    id: string;
    name: string;
    score: number;
    districtId?: string | null;
    regionId?: string | null;
    subDistrictUnitId?: string | null;
    electoralAreaId?: string | null;
    aliases?: string[];
  }> = [];

  result.regions.forEach((row, index) => {
    ranked.push({
      type: 'region',
      id: row.id,
      name: row.name,
      score: result.scores.regions[index] ?? 0,
    });
  });
  result.districts.forEach((row, index) => {
    ranked.push({
      type: 'district',
      id: row.id,
      name: row.name,
      score: result.scores.districts[index] ?? 0,
      regionId: row.regionId,
    });
  });
  result.subDistrictUnits.forEach((row, index) => {
    ranked.push({
      type: 'sub_district_unit',
      id: row.id,
      name: row.name,
      score: result.scores.subDistrictUnits[index] ?? 0,
      districtId: row.districtId,
    });
  });
  result.electoralAreas.forEach((row, index) => {
    ranked.push({
      type: 'electoral_area',
      id: row.id,
      name: row.name,
      score: result.scores.electoralAreas[index] ?? 0,
      districtId: row.districtId,
      subDistrictUnitId: row.subDistrictUnitId,
    });
  });
  result.communities.forEach((row, index) => {
    ranked.push({
      type: 'community',
      id: row.id,
      name: row.name,
      score: result.scores.communities[index] ?? 0,
      districtId: row.districtId,
      electoralAreaId: row.electoralAreaId,
      aliases: row.aliases,
    });
  });

  const allowedTypes = options?.types?.length ? new Set(options.types) : null;
  const districtId = options?.districtId?.trim() || null;

  return ranked
    .filter((row) => {
      if (allowedTypes && !allowedTypes.has(row.type)) {
        return false;
      }
      if (districtId && row.type === 'community' && row.districtId !== districtId) {
        return false;
      }
      if (districtId && row.type === 'electoral_area' && row.districtId !== districtId) {
        return false;
      }
      if (districtId && row.type === 'sub_district_unit' && row.districtId !== districtId) {
        return false;
      }
      return true;
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export async function upsertLocationAlias(input: {
  id: string;
  entityType: string;
  entityId: string;
  alias: string;
  normalisedAlias: string;
  source: string;
  datasetVersion: string;
  isActive: boolean;
}) {
  const db = getDb();
  await db
    .insert(locationAliases)
    .values({
      ...input,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [locationAliases.entityType, locationAliases.entityId, locationAliases.normalisedAlias],
      set: {
        alias: input.alias,
        source: input.source,
        datasetVersion: input.datasetVersion,
        isActive: input.isActive,
        updatedAt: new Date(),
      },
    });
}

export async function upsertLocationAliasesBatch(
  rows: Array<{
    id: string;
    entityType: string;
    entityId: string;
    alias: string;
    normalisedAlias: string;
    source: string;
    datasetVersion: string;
    isActive: boolean;
  }>,
) {
  if (rows.length === 0) {
    return;
  }
  const db = getDb();
  const chunkSize = 200;
  for (let offset = 0; offset < rows.length; offset += chunkSize) {
    const chunk = rows.slice(offset, offset + chunkSize);
    await db
      .insert(locationAliases)
      .values(chunk.map((row) => ({ ...row, updatedAt: new Date() })))
      .onConflictDoUpdate({
        target: [locationAliases.entityType, locationAliases.entityId, locationAliases.normalisedAlias],
        set: {
          alias: sql`excluded.alias`,
          source: sql`excluded.source`,
          datasetVersion: sql`excluded.dataset_version`,
          isActive: sql`excluded.is_active`,
          updatedAt: new Date(),
        },
      });
  }
}

export async function listAliasesByEntity(entityType: string, entityId: string) {
  const db = getDb();
  return db
    .select()
    .from(locationAliases)
    .where(
      and(
        eq(locationAliases.entityType, entityType),
        eq(locationAliases.entityId, entityId),
        eq(locationAliases.isActive, true),
      ),
    )
    .orderBy(asc(locationAliases.alias));
}

export async function upsertRegion(input: Omit<RegionMasterRow, 'createdAt' | 'updatedAt'>) {
  const db = getDb();
  await db
    .insert(regions)
    .values({
      ...input,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [regions.source, regions.sourceId],
      set: {
        code: input.code,
        name: input.name,
        datasetVersion: input.datasetVersion,
        isActive: input.isActive,
        updatedAt: new Date(),
      },
    });
}

export async function updateRegionById(input: Omit<RegionMasterRow, 'createdAt' | 'updatedAt'>) {
  const db = getDb();
  await db
    .update(regions)
    .set({
      code: input.code,
      name: input.name,
      source: input.source,
      sourceId: input.sourceId,
      datasetVersion: input.datasetVersion,
      isActive: input.isActive,
      updatedAt: new Date(),
    })
    .where(eq(regions.id, input.id));
}

export async function upsertDistrict(input: Omit<DistrictMasterRow, 'createdAt' | 'updatedAt'>) {
  const db = getDb();
  await db
    .insert(districts)
    .values({
      ...input,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [districts.source, districts.sourceId],
      set: {
        regionId: input.regionId,
        code: input.code,
        name: input.name,
        category: input.category,
        datasetVersion: input.datasetVersion,
        isActive: input.isActive,
        updatedAt: new Date(),
      },
    });
}

export async function updateDistrictById(input: Omit<DistrictMasterRow, 'createdAt' | 'updatedAt'>) {
  const db = getDb();
  await db
    .update(districts)
    .set({
      regionId: input.regionId,
      code: input.code,
      name: input.name,
      category: input.category,
      source: input.source,
      sourceId: input.sourceId,
      datasetVersion: input.datasetVersion,
      isActive: input.isActive,
      updatedAt: new Date(),
    })
    .where(eq(districts.id, input.id));
}

export async function upsertCommunity(input: Omit<CommunityMasterRow, 'createdAt' | 'updatedAt'>) {
  await upsertCommunitiesBatch([input]);
}

export async function upsertCommunitiesBatch(
  rows: Array<Omit<CommunityMasterRow, 'createdAt' | 'updatedAt'>>,
) {
  if (rows.length === 0) {
    return;
  }
  const db = getDb();
  const chunkSize = 150;
  for (let offset = 0; offset < rows.length; offset += chunkSize) {
    const chunk = rows.slice(offset, offset + chunkSize);
    let attempt = 0;
    for (;;) {
      try {
        await db
          .insert(communities)
          .values(
            chunk.map((input) => ({
              ...input,
              electoralAreaId: input.electoralAreaId ?? null,
              geometryRef: input.geometryRef ?? null,
              updatedAt: new Date(),
            })),
          )
          .onConflictDoUpdate({
            target: [communities.source, communities.sourceId],
            set: {
              districtId: sql`excluded.district_id`,
              electoralAreaId: sql`excluded.electoral_area_id`,
              code: sql`excluded.code`,
              name: sql`excluded.name`,
              aliases: sql`excluded.aliases`,
              latitude: sql`excluded.latitude`,
              longitude: sql`excluded.longitude`,
              geometryRef: sql`excluded.geometry_ref`,
              datasetVersion: sql`excluded.dataset_version`,
              isActive: sql`excluded.is_active`,
              updatedAt: new Date(),
            },
          });
        break;
      } catch (error) {
        attempt += 1;
        if (attempt >= 4) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
      }
    }
  }
}

export async function updateCommunityById(input: Omit<CommunityMasterRow, 'createdAt' | 'updatedAt'>) {
  const db = getDb();
  await db
    .update(communities)
    .set({
      districtId: input.districtId,
      electoralAreaId: input.electoralAreaId ?? null,
      code: input.code,
      name: input.name,
      aliases: input.aliases,
      latitude: input.latitude,
      longitude: input.longitude,
      geometryRef: input.geometryRef ?? null,
      source: input.source,
      sourceId: input.sourceId,
      datasetVersion: input.datasetVersion,
      isActive: input.isActive,
      updatedAt: new Date(),
    })
    .where(eq(communities.id, input.id));
}

export async function createPendingCommunitySuggestion(input: {
  id: string;
  districtId?: string | null;
  electoralAreaId?: string | null;
  proposedName: string;
  proposedByUserId?: string | null;
}) {
  const db = getDb();
  const [row] = await db
    .insert(pendingCommunitySuggestions)
    .values({
      id: input.id,
      districtId: input.districtId ?? null,
      electoralAreaId: input.electoralAreaId ?? null,
      proposedName: input.proposedName,
      proposedByUserId: input.proposedByUserId ?? null,
    })
    .returning();
  return row;
}

export async function logLocationSync(input: {
  id: string;
  datasetSource: string;
  datasetVersion: string;
  checksum?: string | null;
  regionsImported: number;
  districtsImported: number;
  subDistrictUnitsImported?: number;
  electoralAreasImported?: number;
  communitiesImported: number;
  aliasesImported?: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'PARTIAL';
  notes?: string | null;
}) {
  const db = getDb();
  const [row] = await db
    .insert(locationSyncLog)
    .values({
      ...input,
      checksum: input.checksum ?? null,
      subDistrictUnitsImported: input.subDistrictUnitsImported ?? 0,
      electoralAreasImported: input.electoralAreasImported ?? 0,
      aliasesImported: input.aliasesImported ?? 0,
      notes: input.notes ?? null,
    })
    .returning();
  return row;
}

export async function getLatestLocationSync() {
  const db = getDb();
  const [row] = await db.select().from(locationSyncLog).orderBy(desc(locationSyncLog.importedAt)).limit(1);
  return row ?? null;
}

export async function listAllDistricts() {
  const db = getDb();
  return db.select().from(districts);
}

export async function listAllRegions() {
  const db = getDb();
  return db.select().from(regions);
}

export async function listAllCommunities() {
  const db = getDb();
  return db.select().from(communities);
}

export async function upsertSubDistrictUnit(input: Omit<SubDistrictUnitRow, 'createdAt' | 'updatedAt'>) {
  const db = getDb();
  await db
    .insert(subDistrictUnits)
    .values({
      ...input,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [subDistrictUnits.source, subDistrictUnits.sourceId],
      set: {
        districtId: input.districtId,
        code: input.code,
        name: input.name,
        unitType: input.unitType,
        datasetVersion: input.datasetVersion,
        isActive: input.isActive,
        updatedAt: new Date(),
      },
    });
}

export async function upsertElectoralArea(input: Omit<ElectoralAreaRow, 'createdAt' | 'updatedAt'>) {
  const db = getDb();
  await db
    .insert(electoralAreas)
    .values({
      ...input,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [electoralAreas.source, electoralAreas.sourceId],
      set: {
        districtId: input.districtId,
        subDistrictUnitId: input.subDistrictUnitId,
        code: input.code,
        name: input.name,
        datasetVersion: input.datasetVersion,
        isActive: input.isActive,
        updatedAt: new Date(),
      },
    });
}

