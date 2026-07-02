import { sql } from 'drizzle-orm';
import { getDb, isDatabaseEnabled } from './client.js';

/** Tables required for empty-database list endpoints (migrations 0000–0010). */
export const CORE_APPLICATION_TABLES = [
  'borrowers',
  'loans',
  'payments',
  'groups',
  'group_members',
  'loan_pools',
  'collectors',
  'users',
  'financial_reconciliations',
  'risk_flags',
  'message_threads',
  'messages',
] as const;

export interface SchemaHealthReport {
  status: 'ok' | 'degraded' | 'disabled';
  missingTables: string[];
}

export async function verifyCoreApplicationTables(): Promise<SchemaHealthReport> {
  if (!isDatabaseEnabled()) {
    return { status: 'disabled', missingTables: [] };
  }

  const db = getDb();
  const missingTables: string[] = [];

  for (const table of CORE_APPLICATION_TABLES) {
    try {
      const result = await db.execute(
        sql`SELECT to_regclass(${`public.${table}`}) IS NOT NULL AS exists`,
      );
      const rows = result.rows as { exists?: boolean }[];
      if (!rows[0]?.exists) {
        missingTables.push(table);
      }
    } catch {
      missingTables.push(table);
    }
  }

  return {
    status: missingTables.length === 0 ? 'ok' : 'degraded',
    missingTables,
  };
}
