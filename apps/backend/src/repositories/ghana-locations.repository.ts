import { asc, eq } from 'drizzle-orm';
import { getDb, isDatabaseEnabled } from '../db/client.js';
import { ghanaCities, ghanaDistricts, ghanaRegions } from '../db/schema/ghana-locations.js';

export interface GhanaRegionRow {
  id: string;
  name: string;
  code: string;
}

export interface GhanaDistrictRow {
  id: string;
  regionId: string;
  name: string;
  type: string;
  code: string | null;
}

export interface GhanaCityRow {
  id: string;
  districtId: string;
  name: string;
  source: string;
}

export async function countRegions(): Promise<number> {
  if (!isDatabaseEnabled()) {
    return 0;
  }

  const db = getDb();
  const rows = await db.select({ id: ghanaRegions.id }).from(ghanaRegions).limit(1);
  return rows.length;
}

export async function listRegions(): Promise<GhanaRegionRow[]> {
  const db = getDb();
  const rows = await db.select().from(ghanaRegions).orderBy(asc(ghanaRegions.name));
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    code: row.code,
  }));
}

export async function listDistrictsByRegionId(regionId: string): Promise<GhanaDistrictRow[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(ghanaDistricts)
    .where(eq(ghanaDistricts.regionId, regionId))
    .orderBy(asc(ghanaDistricts.name));

  return rows.map((row) => ({
    id: row.id,
    regionId: row.regionId,
    name: row.name,
    type: row.type,
    code: row.code,
  }));
}

export async function listCitiesByDistrictId(districtId: string): Promise<GhanaCityRow[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(ghanaCities)
    .where(eq(ghanaCities.districtId, districtId))
    .orderBy(asc(ghanaCities.name));

  return rows.map((row) => ({
    id: row.id,
    districtId: row.districtId,
    name: row.name,
    source: row.source,
  }));
}

export async function upsertRegion(input: GhanaRegionRow): Promise<void> {
  const db = getDb();
  await db
    .insert(ghanaRegions)
    .values({
      id: input.id,
      name: input.name,
      code: input.code,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: ghanaRegions.id,
      set: {
        name: input.name,
        code: input.code,
        updatedAt: new Date(),
      },
    });
}

export async function upsertDistrict(input: GhanaDistrictRow): Promise<void> {
  const db = getDb();
  await db
    .insert(ghanaDistricts)
    .values({
      id: input.id,
      regionId: input.regionId,
      name: input.name,
      type: input.type,
      code: input.code,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: ghanaDistricts.id,
      set: {
        regionId: input.regionId,
        name: input.name,
        type: input.type,
        code: input.code,
        updatedAt: new Date(),
      },
    });
}

export async function upsertCity(input: GhanaCityRow): Promise<void> {
  const db = getDb();
  await db
    .insert(ghanaCities)
    .values({
      id: input.id,
      districtId: input.districtId,
      name: input.name,
      source: input.source,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: ghanaCities.id,
      set: {
        districtId: input.districtId,
        name: input.name,
        source: input.source,
        updatedAt: new Date(),
      },
    });
}
