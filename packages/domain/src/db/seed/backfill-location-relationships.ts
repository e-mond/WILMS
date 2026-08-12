import '../../config/load-env.js';
import { isNull, sql } from 'drizzle-orm';
import { isDatabaseEnabled, getDb } from '../client.js';
import { borrowers, groups } from '../schema/index.js';

async function main(): Promise<void> {
  if (!isDatabaseEnabled()) {
    console.error('DATABASE_URL is required to backfill location relationships.');
    process.exit(1);
  }

  const db = getDb();

  const regionUpdated = await db.execute(sql`
    UPDATE borrowers b
    SET region_id = r.id
    FROM regions r
    WHERE b.region_id IS NULL
      AND lower(coalesce(b.profile->>'region', '')) = lower(r.name)
  `);

  const districtUpdated = await db.execute(sql`
    UPDATE borrowers b
    SET district_id = d.id
    FROM districts d
    WHERE b.district_id IS NULL
      AND lower(coalesce(b.profile->>'district', '')) = lower(d.name)
  `);

  const communityUpdated = await db.execute(sql`
    UPDATE borrowers b
    SET community_id = c.id
    FROM communities c
    WHERE b.community_id IS NULL
      AND lower(b.community) = lower(c.name)
  `);

  const groupUpdated = await db.execute(sql`
    UPDATE groups g
    SET community_id = c.id
    FROM communities c
    WHERE g.community_id IS NULL
      AND lower(g.community) = lower(c.name)
  `);

  const collectorRegionUpdated = await db.execute(sql`
    UPDATE collectors c
    SET assigned_region_id = r.id
    FROM regions r
    WHERE c.assigned_region_id IS NULL
      AND lower(coalesce(c.assigned_region, '')) = lower(r.name)
  `);

  const collectorDistrictUpdated = await db.execute(sql`
    UPDATE collectors c
    SET assigned_district_id = d.id
    FROM districts d
    WHERE c.assigned_district_id IS NULL
      AND lower(coalesce(c.assigned_district, '')) = lower(d.name)
  `);

  console.log(
    JSON.stringify(
      {
        ok: true,
        borrowersRegionMatched: Number((regionUpdated as { rowCount?: number }).rowCount ?? 0),
        borrowersDistrictMatched: Number((districtUpdated as { rowCount?: number }).rowCount ?? 0),
        borrowersCommunityMatched: Number((communityUpdated as { rowCount?: number }).rowCount ?? 0),
        groupsCommunityMatched: Number((groupUpdated as { rowCount?: number }).rowCount ?? 0),
        collectorsRegionMatched: Number((collectorRegionUpdated as { rowCount?: number }).rowCount ?? 0),
        collectorsDistrictMatched: Number(
          (collectorDistrictUpdated as { rowCount?: number }).rowCount ?? 0,
        ),
        unresolvedBorrowers: (
          await db
            .select({ count: sql<number>`count(*)` })
            .from(borrowers)
            .where(isNull(borrowers.communityId))
        )[0]?.count,
        unresolvedGroups: (
          await db
            .select({ count: sql<number>`count(*)` })
            .from(groups)
            .where(isNull(groups.communityId))
        )[0]?.count,
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
