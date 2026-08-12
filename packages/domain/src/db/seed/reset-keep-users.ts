import '../../config/load-env.js';
import { sql } from 'drizzle-orm';
import { getDb, isDatabaseEnabled } from '../client.js';

const PRESERVE_TABLES = new Set([
  'users',
  'roles',
  'permissions',
  'role_permissions',
  'user_roles',
  'user_permission_overrides',
  '__drizzle_migrations',
]);

async function main(): Promise<void> {
  if (!isDatabaseEnabled()) {
    console.error('DATABASE_URL is required to reset the database.');
    process.exit(1);
  }

  const confirm = process.env.WILMS_CONFIRM_DB_RESET?.trim();
  if (confirm !== 'YES') {
    console.error(
      'Refusing to reset. Set WILMS_CONFIRM_DB_RESET=YES to truncate all tables except users and auth/reference tables.',
    );
    process.exit(1);
  }

  const db = getDb();
  const result = await db.execute(sql`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);

  const tables = (result.rows as Array<{ tablename: string }>)
    .map((row) => row.tablename)
    .filter((table) => !PRESERVE_TABLES.has(table));

  if (tables.length === 0) {
    console.log(JSON.stringify({ ok: true, truncated: [] }, null, 2));
    return;
  }

  const quoted = tables.map((table) => `"${table}"`).join(', ');
  await db.execute(sql.raw(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`));

  console.log(
    JSON.stringify(
      {
        ok: true,
        preserved: [...PRESERVE_TABLES].sort(),
        truncated: tables,
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
