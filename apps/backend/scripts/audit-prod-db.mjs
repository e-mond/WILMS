import '../src/config/load-env.js';
import { sql } from 'drizzle-orm';
import { getDb } from '../src/db/client.js';
import { users } from '../src/db/schema/users.js';

const db = getDb();

const userRows = await db
  .select({
    email: users.email,
    role: users.role,
    status: users.status,
  })
  .from(users);

const migrationRows = await db.execute(sql`
  SELECT COUNT(*)::int AS count, MAX(created_at) AS latest
  FROM drizzle.__drizzle_migrations
`);

const tableCheck = await db.execute(sql`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('offline_sync_operations', 'offline_sync_conflicts')
  ORDER BY table_name
`);

console.log(
  JSON.stringify(
    {
      users: userRows,
      migrations: migrationRows.rows?.[0] ?? migrationRows[0],
      offlineSyncTables: tableCheck.rows ?? tableCheck,
    },
    null,
    2,
  ),
);
