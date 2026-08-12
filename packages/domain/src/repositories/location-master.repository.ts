import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { getDb } from '../db/client.js';
import {
  communities,
  districts,
  electoralAreas,
  locationSyncLog,
  pendingCommunitySuggestions,
  regions,
  subDistrictUnits,
} from '../db/schema/index.js';

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
  const pattern = `%${query.trim()}%`;
  const aliasPredicate = sql<boolean>`exists (
    select 1
    from unnest(${communities.aliases}) as alias
    where alias ilike ${pattern}
  )`;

  const [regionRows, districtRows, communityRows, subUnitRows, electoralAreaRows] = await Promise.all([
    db
      .select()
      .from(regions)
      .where(and(eq(regions.isActive, true), ilike(regions.name, pattern)))
      .orderBy(asc(regions.name))
      .limit(limit),
    db
      .select()
      .from(districts)
      .where(and(eq(districts.isActive, true), ilike(districts.name, pattern)))
      .orderBy(asc(districts.name))
      .limit(limit),
    db
      .select()
      .from(communities)
      .where(and(eq(communities.isActive, true), or(ilike(communities.name, pattern), aliasPredicate)))
      .orderBy(asc(communities.name))
      .limit(limit),
    db
      .select()
      .from(subDistrictUnits)
      .where(and(eq(subDistrictUnits.isActive, true), ilike(subDistrictUnits.name, pattern)))
      .orderBy(asc(subDistrictUnits.name))
      .limit(limit),
    db
      .select()
      .from(electoralAreas)
      .where(and(eq(electoralAreas.isActive, true), ilike(electoralAreas.name, pattern)))
      .orderBy(asc(electoralAreas.name))
      .limit(limit),
  ]);

  return {
    regions: regionRows,
    districts: districtRows,
    communities: communityRows,
    subDistrictUnits: subUnitRows,
    electoralAreas: electoralAreaRows,
  };
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
  const db = getDb();
  await db
    .insert(communities)
    .values({
      ...input,
      electoralAreaId: input.electoralAreaId ?? null,
      geometryRef: input.geometryRef ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [communities.source, communities.sourceId],
      set: {
        districtId: input.districtId,
        electoralAreaId: input.electoralAreaId ?? null,
        code: input.code,
        name: input.name,
        aliases: input.aliases,
        latitude: input.latitude,
        longitude: input.longitude,
        geometryRef: input.geometryRef ?? null,
        datasetVersion: input.datasetVersion,
        isActive: input.isActive,
        updatedAt: new Date(),
      },
    });
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

