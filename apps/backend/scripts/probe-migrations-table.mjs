import '../src/config/load-env.js';
import { getDb } from '../src/db/client.js';
import { sql } from 'drizzle-orm';

const db = getDb();
const tables = await db.execute(sql`
  SELECT table_schema, table_name
  FROM information_schema.tables
  WHERE table_name LIKE '%drizzle%'
`);
console.log('tables:', JSON.stringify(tables.rows, null, 2));

for (const q of [
  `SELECT COUNT(*)::int AS count FROM drizzle.__drizzle_migrations`,
  `SELECT COUNT(*)::int AS count FROM "__drizzle_migrations"`,
  `SELECT COUNT(*)::int AS count FROM public.__drizzle_migrations`,
]) {
  try {
    const r = await db.execute(sql.raw(q));
    console.log(q, '=>', r.rows);
  } catch (e) {
    console.log(q, '=> ERR', e.message);
  }
}
