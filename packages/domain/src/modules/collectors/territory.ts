import { and, eq, isNull, or, sql } from 'drizzle-orm';
import { getDb, isDatabaseEnabled } from '../../db/client.js';
import { borrowers } from '../../db/schema/borrowers.js';
import { collectors, users } from '../../db/schema/users.js';
import { groups } from '../../db/schema/groups.js';

export interface TerritoryAssignment {
  collectorUserId: string;
  displayName: string;
  collectorCode: string | null;
  assignedRegion: string | null;
  assignedDistrict: string | null;
  assignedRegionId: string | null;
  assignedDistrictId: string | null;
  assignedSubDistrictUnitId: string | null;
  assignedElectoralAreaId: string | null;
  assignedCommunityId: string | null;
}

export interface TerritorySummary extends TerritoryAssignment {
  borrowerCount: number;
  groupCount: number;
  overlapCollectors: Array<{ userId: string; displayName: string; sharedLevel: string }>;
}

function sharedLevel(a: TerritoryAssignment, b: TerritoryAssignment): string | null {
  if (a.assignedCommunityId && a.assignedCommunityId === b.assignedCommunityId) {
    return 'community';
  }
  if (a.assignedElectoralAreaId && a.assignedElectoralAreaId === b.assignedElectoralAreaId) {
    return 'electoral_area';
  }
  if (a.assignedSubDistrictUnitId && a.assignedSubDistrictUnitId === b.assignedSubDistrictUnitId) {
    return 'sub_district_unit';
  }
  if (a.assignedDistrictId && a.assignedDistrictId === b.assignedDistrictId) {
    return 'district';
  }
  if (a.assignedRegionId && a.assignedRegionId === b.assignedRegionId) {
    return 'region';
  }
  if (
    a.assignedDistrict &&
    b.assignedDistrict &&
    a.assignedDistrict.toLowerCase() === b.assignedDistrict.toLowerCase()
  ) {
    return 'district_text';
  }
  return null;
}

export async function listTerritoryAssignments(): Promise<TerritoryAssignment[]> {
  if (!isDatabaseEnabled()) {
    return [];
  }
  const db = getDb();
  return db
    .select({
      collectorUserId: users.id,
      displayName: users.displayName,
      collectorCode: collectors.collectorCode,
      assignedRegion: collectors.assignedRegion,
      assignedDistrict: collectors.assignedDistrict,
      assignedRegionId: collectors.assignedRegionId,
      assignedDistrictId: collectors.assignedDistrictId,
      assignedSubDistrictUnitId: collectors.assignedSubDistrictUnitId,
      assignedElectoralAreaId: collectors.assignedElectoralAreaId,
      assignedCommunityId: collectors.assignedCommunityId,
    })
    .from(collectors)
    .innerJoin(users, eq(users.id, collectors.userId))
    .where(and(isNull(users.deletedAt), isNull(collectors.deletedAt)));
}

export async function getCollectorTerritorySummary(collectorUserId: string): Promise<TerritorySummary | null> {
  const assignments = await listTerritoryAssignments();
  const target = assignments.find((row) => row.collectorUserId === collectorUserId);
  if (!target) {
    return null;
  }

  const overlaps = assignments
    .filter((row) => row.collectorUserId !== collectorUserId)
    .map((row) => {
      const level = sharedLevel(target, row);
      return level
        ? { userId: row.collectorUserId, displayName: row.displayName, sharedLevel: level }
        : null;
    })
    .filter((row): row is { userId: string; displayName: string; sharedLevel: string } => Boolean(row));

  if (!isDatabaseEnabled()) {
    return {
      ...target,
      borrowerCount: 0,
      groupCount: 0,
      overlapCollectors: overlaps,
    };
  }

  const db = getDb();
  const borrowerPredicate = or(
    target.assignedCommunityId ? eq(borrowers.communityId, target.assignedCommunityId) : sql`false`,
    target.assignedElectoralAreaId
      ? eq(borrowers.electoralAreaId, target.assignedElectoralAreaId)
      : sql`false`,
    target.assignedSubDistrictUnitId
      ? eq(borrowers.subDistrictUnitId, target.assignedSubDistrictUnitId)
      : sql`false`,
    target.assignedDistrictId ? eq(borrowers.districtId, target.assignedDistrictId) : sql`false`,
    target.assignedRegionId ? eq(borrowers.regionId, target.assignedRegionId) : sql`false`,
  );

  const [borrowerCountRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(borrowers)
    .where(and(isNull(borrowers.deletedAt), borrowerPredicate));

  const groupPredicate = or(
    target.assignedCommunityId ? eq(groups.communityId, target.assignedCommunityId) : sql`false`,
    target.assignedElectoralAreaId
      ? eq(groups.electoralAreaId, target.assignedElectoralAreaId)
      : sql`false`,
    target.assignedSubDistrictUnitId
      ? eq(groups.subDistrictUnitId, target.assignedSubDistrictUnitId)
      : sql`false`,
  );

  const [groupCountRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(groups)
    .where(and(isNull(groups.deletedAt), groupPredicate));

  return {
    ...target,
    borrowerCount: borrowerCountRow?.count ?? 0,
    groupCount: groupCountRow?.count ?? 0,
    overlapCollectors: overlaps,
  };
}

export async function listTerritoryOverlaps() {
  const assignments = await listTerritoryAssignments();
  const pairs: Array<{
    leftUserId: string;
    leftDisplayName: string;
    rightUserId: string;
    rightDisplayName: string;
    sharedLevel: string;
  }> = [];

  for (let i = 0; i < assignments.length; i += 1) {
    for (let j = i + 1; j < assignments.length; j += 1) {
      const level = sharedLevel(assignments[i]!, assignments[j]!);
      if (!level) {
        continue;
      }
      pairs.push({
        leftUserId: assignments[i]!.collectorUserId,
        leftDisplayName: assignments[i]!.displayName,
        rightUserId: assignments[j]!.collectorUserId,
        rightDisplayName: assignments[j]!.displayName,
        sharedLevel: level,
      });
    }
  }
  return { generatedAt: new Date().toISOString(), overlaps: pairs };
}
