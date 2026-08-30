import { and, count, eq, isNull, sql } from 'drizzle-orm';
import { getDb, isDatabaseEnabled, type WilmsDb } from '../db/client.js';
import { loans } from '../db/schema/loans.js';

export interface DefaulterAggregateRow {
  loanId: string;
  borrowerId: string;
  borrowerName: string;
  community: string;
  groupName: string;
  missedWeeks: number;
  outstandingPesewas: number;
  lastPaymentDate: string | null;
}

export interface DefaulterAggregateSummary {
  totalDefaulters: number;
  totalOutstandingPesewas: number;
}

type AggregateSqlRow = {
  loan_id?: string;
  borrower_id?: string;
  borrower_name?: string;
  community?: string;
  group_name?: string;
  missed_weeks?: number | string;
  loan_balance_pesewas?: number | string;
  last_payment_date?: string | null;
};

/**
 * Database-level defaulter aggregation for DEFAULTED loans.
 * Uses raw SQL CTEs for Neon/Drizzle stability; returns null so callers can fall back.
 */
export async function queryDefaulterAggregates(
  tx: WilmsDb = getDb(),
): Promise<{
  rows: DefaulterAggregateRow[];
  summary: DefaulterAggregateSummary;
} | null> {
  if (!isDatabaseEnabled()) {
    return null;
  }

  try {
    const result = await tx.execute(sql`
      WITH missed_cte AS (
        SELECT loan_id, COUNT(*)::int AS missed_count
        FROM loan_schedules
        WHERE status = 'MISSED'
        GROUP BY loan_id
      ),
      last_payment_cte AS (
        SELECT borrower_id, MAX(payment_date) AS last_date
        FROM payments
        WHERE status <> 'REVERSED'
        GROUP BY borrower_id
      ),
      group_name_cte AS (
        SELECT DISTINCT ON (gm.borrower_id)
          gm.borrower_id,
          COALESCE(g.display_name, g.name) AS group_name
        FROM group_members gm
        INNER JOIN groups g ON g.id = gm.group_id
        WHERE gm.removed_at IS NULL
        ORDER BY gm.borrower_id, gm.joined_at DESC
      )
      SELECT
        l.id AS loan_id,
        l.borrower_id,
        b.full_name AS borrower_name,
        b.community,
        COALESCE(gn.group_name, '') AS group_name,
        COALESCE(m.missed_count, 0)::int AS missed_weeks,
        ROUND(l.loan_balance::numeric * 100)::int AS loan_balance_pesewas,
        lp.last_date AS last_payment_date
      FROM loans l
      INNER JOIN borrowers b ON b.id = l.borrower_id
      LEFT JOIN missed_cte m ON m.loan_id = l.id
      LEFT JOIN last_payment_cte lp ON lp.borrower_id = l.borrower_id
      LEFT JOIN group_name_cte gn ON gn.borrower_id = l.borrower_id
      WHERE l.external_status = 'DEFAULTED'
        AND l.deleted_at IS NULL
    `);

    const mapped: DefaulterAggregateRow[] = (result.rows as AggregateSqlRow[]).map((row) => ({
      loanId: String(row.loan_id ?? ''),
      borrowerId: String(row.borrower_id ?? ''),
      borrowerName: String(row.borrower_name ?? 'Unknown borrower'),
      community: String(row.community ?? '—'),
      groupName: String(row.group_name ?? ''),
      missedWeeks: Number(row.missed_weeks ?? 0),
      outstandingPesewas: Number(row.loan_balance_pesewas ?? 0),
      lastPaymentDate: row.last_payment_date ?? null,
    }));

    const totalOutstandingPesewas = mapped.reduce(
      (sum, row) => sum + row.outstandingPesewas,
      0,
    );

    return {
      rows: mapped,
      summary: {
        totalDefaulters: mapped.length,
        totalOutstandingPesewas,
      },
    };
  } catch {
    return null;
  }
}

/** Count of all DEFAULTED non-deleted loans in the database. */
export async function countDefaultedLoans(tx: WilmsDb = getDb()): Promise<number> {
  if (!isDatabaseEnabled()) {
    return 0;
  }
  const [row] = await tx
    .select({ total: count() })
    .from(loans)
    .where(and(eq(loans.externalStatus, 'DEFAULTED'), isNull(loans.deletedAt)));
  return Number(row?.total ?? 0);
}
