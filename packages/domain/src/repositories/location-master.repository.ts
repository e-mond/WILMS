import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { getDb } from '../db/client.js';
import {
  communities,
  districts,
  locationSyncLog,
  pendingCommunitySuggestions,
  regions,
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
  code: string | null;
  name: string;
  aliases: string[];
  latitude: number | null;
  longitude: number | null;
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

export async function searchLocations(query: string, limit = 25) {
  const db = getDb();
  const pattern = `%${query.trim()}%`;
  const aliasPredicate = sql<boolean>`exists (
    select 1
    from unnest(${communities.aliases}) as alias
    where alias ilike ${pattern}
  )`;

  const [regionRows, districtRows, communityRows] = await Promise.all([
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
  ]);

  return { regions: regionRows, districts: districtRows, communities: communityRows };
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

export async function upsertCommunity(input: Omit<CommunityMasterRow, 'createdAt' | 'updatedAt'>) {
  const db = getDb();
  await db
    .insert(communities)
    .values({
      ...input,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [communities.source, communities.sourceId],
      set: {
        districtId: input.districtId,
        code: input.code,
        name: input.name,
        aliases: input.aliases,
        latitude: input.latitude,
        longitude: input.longitude,
        datasetVersion: input.datasetVersion,
        isActive: input.isActive,
        updatedAt: new Date(),
      },
    });
}

export async function createPendingCommunitySuggestion(input: {
  id: string;
  districtId?: string | null;
  proposedName: string;
  proposedByUserId?: string | null;
}) {
  const db = getDb();
  const [row] = await db
    .insert(pendingCommunitySuggestions)
    .values({
      id: input.id,
      districtId: input.districtId ?? null,
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
  regionsImported: number;
  districtsImported: number;
  communitiesImported: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'PARTIAL';
  notes?: string | null;
}) {
  const db = getDb();
  const [row] = await db
    .insert(locationSyncLog)
    .values({
      ...input,
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
