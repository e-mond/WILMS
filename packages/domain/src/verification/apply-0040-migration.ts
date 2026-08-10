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

const tag = '0040_v180_phase33_idempotency_scopes';
const when = 1785631200000;
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

  const before = await db.execute(sql`
    SELECT e.enumlabel
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'idempotency_scope'
    ORDER BY e.enumsortorder
  `);
  console.log(
    'scopes before',
    (before.rows as { enumlabel: string }[]).map((r) => r.enumlabel),
  );

  await db.execute(sql.raw(`ALTER TYPE "public"."idempotency_scope" ADD VALUE IF NOT EXISTS 'EXPENSE_CREATE'`));
  await db.execute(sql.raw(`ALTER TYPE "public"."idempotency_scope" ADD VALUE IF NOT EXISTS 'ADMIN_FEE_RECORD'`));

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

  const after = await db.execute(sql`
    SELECT e.enumlabel
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'idempotency_scope'
    ORDER BY e.enumsortorder
  `);
  console.log(
    'scopes after',
    (after.rows as { enumlabel: string }[]).map((r) => r.enumlabel),
  );

  const latest = await db.execute(sql`
    SELECT COUNT(*)::int AS count, MAX(created_at) AS latest
    FROM drizzle.__drizzle_migrations
  `);
  console.log('migrations table', latest.rows[0]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
