import { sql } from 'drizzle-orm';
import { getDb, isDatabaseEnabled } from './client.js';

/** Core tables (migrations 0000–0010). */
const LEGACY_CORE_TABLES = [
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

/** Tables introduced in migrations 0017–0020 (v1.2.2+). */
export const EXTENDED_APPLICATION_TABLES = [
  'auth_otp_challenges',
  'borrower_admin_fees',
  'organization_holidays',
  'loan_fee_charges',
  'loan_penalty_rules',
] as const;

/** Full set verified by production health probes. */
export const CORE_APPLICATION_TABLES = [
  ...LEGACY_CORE_TABLES,
  ...EXTENDED_APPLICATION_TABLES,
] as const;

export interface SchemaHealthReport {
  status: 'ok' | 'degraded' | 'disabled';
  missingTables: string[];
}

/**
 * Verifies core tables exist (single query — safe for Neon cold start / health probes).
 */
export async function verifyCoreApplicationTables(): Promise<SchemaHealthReport> {
  if (!isDatabaseEnabled()) {
    return { status: 'disabled', missingTables: [] };
  }

  const db = getDb();
  const tableList = CORE_APPLICATION_TABLES.join("','");

  try {
    const result = await db.execute(
      sql.raw(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN ('${tableList}')
      `),
    );
    const rows = result.rows as { table_name?: string }[];
    const present = new Set(rows.map((row) => row.table_name).filter(Boolean));
    const missingTables = CORE_APPLICATION_TABLES.filter((table) => !present.has(table));

    return {
      status: missingTables.length === 0 ? 'ok' : 'degraded',
      missingTables,
    };
  } catch (error) {
    console.error('[schema-health] table probe failed:', error);
    return {
      status: 'degraded',
      missingTables: [...CORE_APPLICATION_TABLES],
    };
  }
}
