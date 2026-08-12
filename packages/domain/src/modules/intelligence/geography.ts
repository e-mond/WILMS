import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import { getDb, isDatabaseEnabled } from '../../db/client.js';
import { borrowers } from '../../db/schema/borrowers.js';
import { communities } from '../../db/schema/communities.js';
import { districts } from '../../db/schema/districts.js';
import { electoralAreas } from '../../db/schema/electoral-areas.js';
import { regions } from '../../db/schema/regions.js';
import { subDistrictUnits } from '../../db/schema/sub-district-units.js';

export type GeographyLevel = 'region' | 'mmda' | 'subDistrictUnit' | 'electoralArea' | 'community';

export async function buildGeographicDrilldown(input: {
  level: GeographyLevel;
  parentId?: string;
}) {
  if (!isDatabaseEnabled()) {
    return {
      generatedAt: new Date().toISOString(),
      level: input.level,
      parentId: input.parentId ?? null,
      rows: [],
      unresolvedBorrowerLocations: 0,
    };
  }

  const db = getDb();
  const [unresolved] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(borrowers)
    .where(
      and(
        isNull(borrowers.deletedAt),
        sql`${borrowers.regionId} is null and ${borrowers.districtId} is null and ${borrowers.communityId} is null`,
      ),
    );

  if (input.level === 'region') {
    const rows = await db
      .select({
        id: regions.id,
        name: regions.name,
        activeBorrowers: sql<number>`count(${borrowers.id})::int`,
      })
      .from(regions)
      .leftJoin(borrowers, and(eq(borrowers.regionId, regions.id), isNull(borrowers.deletedAt)))
      .where(eq(regions.isActive, true))
      .groupBy(regions.id, regions.name)
      .orderBy(asc(regions.name));
    return {
      generatedAt: new Date().toISOString(),
      level: input.level,
      parentId: null,
      rows,
      unresolvedBorrowerLocations: unresolved?.count ?? 0,
    };
  }

  if (input.level === 'mmda') {
    const rows = await db
      .select({
        id: districts.id,
        name: districts.name,
        parentId: districts.regionId,
        activeBorrowers: sql<number>`count(${borrowers.id})::int`,
      })
      .from(districts)
      .leftJoin(borrowers, and(eq(borrowers.districtId, districts.id), isNull(borrowers.deletedAt)))
      .where(
        and(
          eq(districts.isActive, true),
          input.parentId ? eq(districts.regionId, input.parentId) : sql`true`,
        ),
      )
      .groupBy(districts.id, districts.name, districts.regionId)
      .orderBy(asc(districts.name));
    return {
      generatedAt: new Date().toISOString(),
      level: input.level,
      parentId: input.parentId ?? null,
      rows,
      unresolvedBorrowerLocations: unresolved?.count ?? 0,
    };
  }

  if (input.level === 'subDistrictUnit') {
    const rows = await db
      .select({
        id: subDistrictUnits.id,
        name: subDistrictUnits.name,
        parentId: subDistrictUnits.districtId,
        activeBorrowers: sql<number>`count(${borrowers.id})::int`,
      })
      .from(subDistrictUnits)
      .leftJoin(
        borrowers,
        and(eq(borrowers.subDistrictUnitId, subDistrictUnits.id), isNull(borrowers.deletedAt)),
      )
      .where(
        and(
          eq(subDistrictUnits.isActive, true),
          input.parentId ? eq(subDistrictUnits.districtId, input.parentId) : sql`true`,
        ),
      )
      .groupBy(subDistrictUnits.id, subDistrictUnits.name, subDistrictUnits.districtId)
      .orderBy(asc(subDistrictUnits.name));
    return {
      generatedAt: new Date().toISOString(),
      level: input.level,
      parentId: input.parentId ?? null,
      rows,
      unresolvedBorrowerLocations: unresolved?.count ?? 0,
    };
  }

  if (input.level === 'electoralArea') {
    const rows = await db
      .select({
        id: electoralAreas.id,
        name: electoralAreas.name,
        parentId: electoralAreas.districtId,
        activeBorrowers: sql<number>`count(${borrowers.id})::int`,
      })
      .from(electoralAreas)
      .leftJoin(
        borrowers,
        and(eq(borrowers.electoralAreaId, electoralAreas.id), isNull(borrowers.deletedAt)),
      )
      .where(
        and(
          eq(electoralAreas.isActive, true),
          input.parentId ? eq(electoralAreas.districtId, input.parentId) : sql`true`,
        ),
      )
      .groupBy(electoralAreas.id, electoralAreas.name, electoralAreas.districtId)
      .orderBy(asc(electoralAreas.name));
    return {
      generatedAt: new Date().toISOString(),
      level: input.level,
      parentId: input.parentId ?? null,
      rows,
      unresolvedBorrowerLocations: unresolved?.count ?? 0,
    };
  }

  const rows = await db
    .select({
      id: communities.id,
      name: communities.name,
      parentId: communities.districtId,
      latitude: communities.latitude,
      longitude: communities.longitude,
      activeBorrowers: sql<number>`count(${borrowers.id})::int`,
    })
    .from(communities)
    .leftJoin(borrowers, and(eq(borrowers.communityId, communities.id), isNull(borrowers.deletedAt)))
    .where(
      and(
        eq(communities.isActive, true),
        input.parentId ? eq(communities.districtId, input.parentId) : sql`true`,
      ),
    )
    .groupBy(
      communities.id,
      communities.name,
      communities.districtId,
      communities.latitude,
      communities.longitude,
    )
    .orderBy(asc(communities.name));

  return {
    generatedAt: new Date().toISOString(),
    level: input.level,
    parentId: input.parentId ?? null,
    rows,
    unresolvedBorrowerLocations: unresolved?.count ?? 0,
  };
}

export async function buildGeographicHeatmap(level: GeographyLevel = 'community') {
  if (!isDatabaseEnabled() || level !== 'community') {
    return {
      generatedAt: new Date().toISOString(),
      level,
      points: [] as Array<{ id: string; name: string; latitude: number; longitude: number; weight: number }>,
    };
  }

  const db = getDb();
  const rows = await db
    .select({
      id: communities.id,
      name: communities.name,
      latitude: communities.latitude,
      longitude: communities.longitude,
      weight: sql<number>`count(${borrowers.id})::int`,
    })
    .from(communities)
    .leftJoin(borrowers, and(eq(borrowers.communityId, communities.id), isNull(borrowers.deletedAt)))
    .where(
      and(
        eq(communities.isActive, true),
        sql`${communities.latitude} is not null and ${communities.longitude} is not null`,
      ),
    )
    .groupBy(communities.id, communities.name, communities.latitude, communities.longitude)
    .orderBy(sql`count(${borrowers.id}) desc`)
    .limit(5000);

  return {
    generatedAt: new Date().toISOString(),
    level,
    points: rows
      .filter((row) => row.latitude != null && row.longitude != null)
      .map((row) => ({
        id: row.id,
        name: row.name,
        latitude: row.latitude as number,
        longitude: row.longitude as number,
        weight: row.weight,
      })),
  };
}
