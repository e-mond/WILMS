/**
 * Re-apply Drizzle migrations when __drizzle_migrations is ahead of actual tables
 * (e.g. partial DB reset with auth users preserved).
 *
 * Usage:
 *   npx tsx scripts/repair-production-schema.mjs           # dry-run
 *   npx tsx scripts/repair-production-schema.mjs --execute
 *
 * Requires DATABASE_URL (production via `railway run --service WILMS -- ...`).
 */
import { Pool, neonConfig } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import ws from 'ws';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import '../src/config/load-env.js';

neonConfig.webSocketConstructor = ws;

const execute = process.argv.includes('--execute');
const migrationsFolder = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../src/db/migrations',
);

const pool = new Pool({ connectionString: process.env.DATABASE_URL?.trim() });
const db = drizzle(pool);

const tableCount = await db.execute(sql`
  SELECT COUNT(*)::int AS count
  FROM information_schema.tables
  WHERE table_schema = 'public'
`);
const publicTables = await db.execute(sql`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
  ORDER BY table_name
`);
const migrationCount = await db.execute(sql`
  SELECT COUNT(*)::int AS count FROM drizzle.__drizzle_migrations
`);

console.log(
  JSON.stringify(
    {
      mode: execute ? 'execute' : 'dry-run',
      publicTableCount: tableCount.rows[0]?.count ?? 0,
      publicTables: publicTables.rows.map((row) => row.table_name),
      appliedMigrations: migrationCount.rows[0]?.count ?? 0,
    },
    null,
    2,
  ),
);

if (!execute) {
  console.log('Dry-run only. Re-run with --execute to rebuild schema and restore users.');
  await pool.end();
  process.exit(0);
}

let usersBackup = { rows: [] };
try {
  usersBackup = await db.execute(sql`SELECT * FROM users`);
  console.log(`Backing up ${usersBackup.rows.length} user row(s).`);
} catch (error) {
  console.warn('No users table to back up:', error.message);
}

await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE`);
await db.execute(sql`DROP SCHEMA public CASCADE`);
await db.execute(sql`CREATE SCHEMA public`);
await db.execute(sql`GRANT ALL ON SCHEMA public TO PUBLIC`);
await db.execute(sql`GRANT ALL ON SCHEMA public TO neondb_owner`);

await migrate(db, { migrationsFolder });
console.log('Migrations applied.');

const usersExists = await db.execute(sql`
  SELECT COUNT(*)::int AS count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'users'
`);
if (!usersExists.rows[0]?.count) {
  throw new Error('Migrations finished but public.users was not created.');
}

for (const row of usersBackup.rows) {
  const columns = Object.keys(row);
  const values = columns.map((column) => row[column]);
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
  await pool.query(
    `INSERT INTO users (${columns.map((c) => `"${c}"`).join(', ')}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`,
    values,
  );
}

console.log(`Restored ${usersBackup.rows.length} user row(s).`);

const after = await db.execute(sql`
  SELECT COUNT(*)::int AS count
  FROM information_schema.tables
  WHERE table_schema = 'public'
`);
console.log(`Public tables after repair: ${after.rows[0]?.count ?? 0}`);

await pool.end();
