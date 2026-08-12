import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { and, isNull, sql } from 'drizzle-orm';
import '../config/load-env.js';
import { getDb, isDatabaseEnabled } from '../db/client.js';
import {
  borrowers,
  communities,
  districts,
  electoralAreas,
  groups,
  locationAliases,
  locationDataQualityRuns,
  regions,
  subDistrictUnits,
} from '../db/schema/index.js';
import { normaliseLocationQuery } from '../modules/locations/alias-resolution.js';

async function main() {
  if (!isDatabaseEnabled()) {
    throw new Error('DATABASE_URL is required for community data-quality validation.');
  }
  const db = getDb();

  const [regionCount] = await db.select({ count: sql<number>`count(*)::int` }).from(regions);
  const [districtCount] = await db.select({ count: sql<number>`count(*)::int` }).from(districts);
  const [subUnitCount] = await db.select({ count: sql<number>`count(*)::int` }).from(subDistrictUnits);
  const [electoralCount] = await db.select({ count: sql<number>`count(*)::int` }).from(electoralAreas);
  const [communityCount] = await db.select({ count: sql<number>`count(*)::int` }).from(communities);
  const [aliasCount] = await db.select({ count: sql<number>`count(*)::int` }).from(locationAliases);

  const orphanDistricts = await db.execute(sql`
    select count(*)::int as count
    from districts d
    left join regions r on r.id = d.region_id
    where r.id is null
  `);
  const orphanCommunities = await db.execute(sql`
    select count(*)::int as count
    from communities c
    left join districts d on d.id = c.district_id
    where d.id is null
  `);
  const orphanElectoralLinks = await db.execute(sql`
    select count(*)::int as count
    from communities c
    left join electoral_areas ea on ea.id = c.electoral_area_id
    where c.electoral_area_id is not null and ea.id is null
  `);
  const invalidCoordinates = await db.execute(sql`
    select count(*)::int as count
    from communities
    where (latitude is not null and (latitude < -90 or latitude > 90))
       or (longitude is not null and (longitude < -180 or longitude > 180))
  `);
  const duplicateCommunityNames = await db.execute(sql`
    select count(*)::int as count from (
      select district_id, lower(name) as n, count(*) as c
      from communities
      where is_active = true
      group by 1, 2
      having count(*) > 1
    ) t
  `);
  const duplicateAliases = await db.execute(sql`
    select count(*)::int as count from (
      select entity_type, entity_id, normalised_alias, count(*) as c
      from location_aliases
      where is_active = true
      group by 1,2,3
      having count(*) > 1
    ) t
  `);
  const borrowersMissingCommunity = await db.execute(sql`
    select count(*)::int as count
    from borrowers b
    left join communities c on c.id = b.community_id
    where b.deleted_at is null
      and b.community_id is not null
      and c.id is null
  `);
  const groupsMissingCommunity = await db.execute(sql`
    select count(*)::int as count
    from groups g
    left join communities c on c.id = g.community_id
    where g.deleted_at is null
      and g.community_id is not null
      and c.id is null
  `);

  const [unresolvedBorrowers] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(borrowers)
    .where(
      and(
        isNull(borrowers.deletedAt),
        sql`${borrowers.regionId} is null and ${borrowers.districtId} is null and ${borrowers.communityId} is null`,
      ),
    );
  const [unresolvedGroups] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(groups)
    .where(and(isNull(groups.deletedAt), sql`${groups.communityId} is null`));

  const mmdasWithCommunities = await db.execute(sql`
    select count(distinct district_id)::int as count
    from communities
    where is_active = true
  `);

  const summary = {
    counts: {
      regions: regionCount?.count ?? 0,
      districts: districtCount?.count ?? 0,
      subDistrictUnits: subUnitCount?.count ?? 0,
      electoralAreas: electoralCount?.count ?? 0,
      communities: communityCount?.count ?? 0,
      aliases: aliasCount?.count ?? 0,
      mmdasWithCommunities: Number(
        (mmdasWithCommunities.rows[0] as { count: number } | undefined)?.count ?? 0,
      ),
    },
    integrity: {
      orphanDistricts: Number((orphanDistricts.rows[0] as { count: number } | undefined)?.count ?? 0),
      orphanCommunities: Number(
        (orphanCommunities.rows[0] as { count: number } | undefined)?.count ?? 0,
      ),
      orphanElectoralLinks: Number(
        (orphanElectoralLinks.rows[0] as { count: number } | undefined)?.count ?? 0,
      ),
      invalidCoordinates: Number(
        (invalidCoordinates.rows[0] as { count: number } | undefined)?.count ?? 0,
      ),
      duplicateCommunityNamesInMmda: Number(
        (duplicateCommunityNames.rows[0] as { count: number } | undefined)?.count ?? 0,
      ),
      duplicateAliases: Number((duplicateAliases.rows[0] as { count: number } | undefined)?.count ?? 0),
      borrowersLinkedToMissingCommunities: Number(
        (borrowersMissingCommunity.rows[0] as { count: number } | undefined)?.count ?? 0,
      ),
      groupsLinkedToMissingCommunities: Number(
        (groupsMissingCommunity.rows[0] as { count: number } | undefined)?.count ?? 0,
      ),
    },
    coverageGaps: {
      unresolvedBorrowerLocationUuids: unresolvedBorrowers?.count ?? 0,
      unresolvedGroupCommunityUuids: unresolvedGroups?.count ?? 0,
      electoralAreasRemainStmaOnly: true,
    },
    normalisationSample: normaliseLocationQuery('Sekondi-Takoradi / Market Circle'),
  };

  const failed =
    summary.integrity.orphanDistricts > 0 ||
    summary.integrity.orphanCommunities > 0 ||
    summary.integrity.orphanElectoralLinks > 0 ||
    summary.integrity.invalidCoordinates > 0 ||
    summary.integrity.duplicateAliases > 0 ||
    summary.integrity.borrowersLinkedToMissingCommunities > 0 ||
    summary.integrity.groupsLinkedToMissingCommunities > 0;

  await db.insert(locationDataQualityRuns).values({
    id: randomUUID(),
    status: failed ? 'FAILED' : 'PASSED',
    summary,
    notes: 'Automated community location completion data-quality validation',
  });

  const root = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
  const reportPath = join(root, 'documentation/location/COMMUNITY_DATA_QUALITY_REPORT.md');
  const markdown = `# Community Data Quality Report

**Product version:** 1.8.0  
**Generated:** ${new Date().toISOString()}  
**Status:** ${failed ? 'FAILED' : 'PASSED'}  
**Language:** British English

## Counts

| Entity | Count |
|--------|------:|
| Regions | ${summary.counts.regions} |
| MMDAs | ${summary.counts.districts} |
| Sub-district units | ${summary.counts.subDistrictUnits} |
| Electoral areas | ${summary.counts.electoralAreas} |
| Communities | ${summary.counts.communities} |
| Aliases | ${summary.counts.aliases} |
| MMDAs with at least one community | ${summary.counts.mmdasWithCommunities} |

## Integrity

| Check | Result |
|-------|-------:|
| Orphan districts | ${summary.integrity.orphanDistricts} |
| Orphan communities | ${summary.integrity.orphanCommunities} |
| Communities with missing electoral-area FK | ${summary.integrity.orphanElectoralLinks} |
| Invalid coordinates | ${summary.integrity.invalidCoordinates} |
| Duplicate community names within an MMDA | ${summary.integrity.duplicateCommunityNamesInMmda} |
| Duplicate aliases | ${summary.integrity.duplicateAliases} |
| Borrowers linked to missing communities | ${summary.integrity.borrowersLinkedToMissingCommunities} |
| Groups linked to missing communities | ${summary.integrity.groupsLinkedToMissingCommunities} |

## Coverage / resolution gaps

| Gap | Value |
|-----|------:|
| Borrowers without location UUIDs | ${summary.coverageGaps.unresolvedBorrowerLocationUuids} |
| Groups without community UUID | ${summary.coverageGaps.unresolvedGroupCommunityUuids} |
| Electoral areas outside STMA | expected until EC national file |

Duplicate names across different MMDAs are allowed (for example multiple communities named Zongo). Same-MMDA duplicates are reported for operator review and are not treated as hard failures when source datasets retain distinct source IDs.
`;
  writeFileSync(reportPath, markdown, 'utf8');
  console.log(JSON.stringify({ ok: !failed, summary, reportPath }, null, 2));
  if (failed) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
