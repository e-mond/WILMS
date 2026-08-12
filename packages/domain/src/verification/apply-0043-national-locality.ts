import { config } from 'dotenv';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { sql } from 'drizzle-orm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
for (const rel of ['apps/backend/.env.local', '.env.local', '.env']) {
  const p = path.join(root, rel);
  if (existsSync(p)) {
    config({ path: p, override: false });
  }
}

const { getDb, isDatabaseEnabled } = await import('../db/client.js');

const tag = '0043_v180_national_locality_intelligence';
const when = 1785890400000;
const sqlPath = path.join(root, 'packages/domain/src/db/migrations', `${tag}.sql`);

async function main() {
  if (!isDatabaseEnabled()) {
    throw new Error('DATABASE_URL is not configured');
  }
  const db = getDb();
  const sqlBody = readFileSync(sqlPath, 'utf8');
  const hash = createHash('sha256').update(sqlBody).digest('hex');

  console.log('Applying', tag);
  console.log('SQL hash', hash.slice(0, 12));

  const statements = sqlBody
    .split('--> statement-breakpoint')
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await db.execute(sql.raw(statement));
  }

  const existing = await db.execute(sql`
    SELECT id, hash, created_at
    FROM drizzle.__drizzle_migrations
    WHERE created_at = ${when}
    LIMIT 1
  `);

  if ((existing.rows as unknown[]).length === 0) {
    await db.execute(sql`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES (${hash}, ${when})
    `);
    console.log('Inserted drizzle.__drizzle_migrations watermark', when);
  } else {
    console.log('Watermark already present', existing.rows[0]);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
