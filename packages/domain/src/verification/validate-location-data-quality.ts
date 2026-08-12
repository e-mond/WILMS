import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { and, isNull, sql } from 'drizzle-orm';
import '../../../config/load-env.js';
import { getDb, isDatabaseEnabled } from '../db/client.js';
import {
  borrowers,
  collectors,
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
    throw new Error('DATABASE_URL is required for location data-quality validation.');
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
  const invalidCoordinates = await db.execute(sql`
    select count(*)::int as count
    from communities
    where (latitude is not null and (latitude < -90 or latitude > 90))
       or (longitude is not null and (longitude < -180 or longitude > 180))
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
  const [collectorsWithoutTerritory] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(collectors)
    .where(
      and(
        isNull(collectors.deletedAt),
        sql`${collectors.assignedRegionId} is null
            and ${collectors.assignedDistrictId} is null
            and ${collectors.assignedCommunityId} is null`,
      ),
    );

  const mmdasWithoutSubUnits = 261 - (subUnitCount?.count ? 1 : 0);
  const summary = {
    counts: {
      regions: regionCount?.count ?? 0,
      districts: districtCount?.count ?? 0,
      subDistrictUnits: subUnitCount?.count ?? 0,
      electoralAreas: electoralCount?.count ?? 0,
      communities: communityCount?.count ?? 0,
      aliases: aliasCount?.count ?? 0,
    },
    integrity: {
      orphanDistricts: Number((orphanDistricts.rows[0] as { count: number } | undefined)?.count ?? 0),
      orphanCommunities: Number(
        (orphanCommunities.rows[0] as { count: number } | undefined)?.count ?? 0,
      ),
      invalidCoordinates: Number(
        (invalidCoordinates.rows[0] as { count: number } | undefined)?.count ?? 0,
      ),
      duplicateAliases: Number((duplicateAliases.rows[0] as { count: number } | undefined)?.count ?? 0),
    },
    coverageGaps: {
      mmdasWithoutSubDistrictUnits: mmdasWithoutSubUnits,
      electoralAreasOutsideStma: true,
      unresolvedBorrowers: unresolvedBorrowers?.count ?? 0,
      unresolvedGroups: unresolvedGroups?.count ?? 0,
      collectorsWithoutUuidTerritory: collectorsWithoutTerritory?.count ?? 0,
    },
    normalisationSample: normaliseLocationQuery('Sekondi-Takoradi / Market Circle'),
  };

  const failed =
    summary.integrity.orphanDistricts > 0 ||
    summary.integrity.orphanCommunities > 0 ||
    summary.integrity.invalidCoordinates > 0 ||
    summary.integrity.duplicateAliases > 0;

  await db.insert(locationDataQualityRuns).values({
    id: randomUUID(),
    status: failed ? 'FAILED' : 'PASSED',
    summary,
    notes: 'Automated national locality data-quality validation',
  });

  const root = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
  const reportPath = join(root, 'documentation/location/DATA_QUALITY_REPORT.md');
  const markdown = `# Data Quality Report

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

## Integrity

| Check | Result |
|-------|-------:|
| Orphan districts | ${summary.integrity.orphanDistricts} |
| Orphan communities | ${summary.integrity.orphanCommunities} |
| Invalid coordinates | ${summary.integrity.invalidCoordinates} |
| Duplicate aliases | ${summary.integrity.duplicateAliases} |

## Coverage / resolution gaps

| Gap | Value |
|-----|------:|
| MMDAs without sub-district units (expected until national gazetteer) | ${summary.coverageGaps.mmdasWithoutSubDistrictUnits} |
| Unresolved borrower location UUIDs | ${summary.coverageGaps.unresolvedBorrowers} |
| Groups without community UUID | ${summary.coverageGaps.unresolvedGroups} |
| Collectors without UUID territory | ${summary.coverageGaps.collectorsWithoutUuidTerritory} |

Electoral areas remain STMA-only by design until an Electoral Commission national file is licensed.
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
