import { and, count, eq, isNull, ne, sql } from 'drizzle-orm';
import { getDb, isDatabaseEnabled } from '../db/client.js';
import { borrowers } from '../db/schema/borrowers.js';
import { groups, groupMembers } from '../db/schema/groups.js';
import { loans } from '../db/schema/loans.js';
import { loanSchedules } from '../db/schema/loan-schedules.js';
import { payments } from '../db/schema/payments.js';

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

/**
 * Database-level defaulter aggregation.
 * Returns only DEFAULTED loans. All aggregates (missed weeks, outstanding, last payment)
 * are computed in SQL — no per-row N+1 queries, no full list loads, no app-side reduce.
 *
 * Fallback: returns null when DB is not enabled; caller uses the legacy in-memory path.
 */
export async function queryDefaulterAggregates(
  tx = getDb(),
): Promise<{
  rows: DefaulterAggregateRow[];
  summary: DefaulterAggregateSummary;
} | null> {
  if (!isDatabaseEnabled()) {
    return null;
  }

  // Missed weeks per loan (schedule rows with status = 'MISSED')
  const missedWeeksCte = tx
    .select({
      loanId: loanSchedules.loanId,
      missedCount: count().as('missed_count'),
    })
    .from(loanSchedules)
    .where(eq(loanSchedules.status, 'MISSED'))
    .groupBy(loanSchedules.loanId)
    .as('missed_cte');

  // Last confirmed payment date per borrower (excluding reversals)
  const lastPaymentCte = tx
    .select({
      borrowerId: payments.borrowerId,
      lastDate: sql<string>`MAX(${payments.paymentDate})`.as('last_date'),
    })
    .from(payments)
    .where(ne(payments.status, 'REVERSED'))
    .groupBy(payments.borrowerId)
    .as('last_payment_cte');

  // Group name: take the first group the borrower belongs to
  const groupNameCte = tx
    .select({
      borrowerId: groupMembers.borrowerId,
      groupName: groups.name,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groupMembers.groupId, groups.id))
    .where(isNull(groupMembers.removedAt))
    .as('group_name_cte');

  const rows = await tx
    .select({
      loanId: loans.id,
      borrowerId: loans.borrowerId,
      borrowerName: borrowers.fullName,
      community: borrowers.community,
      groupName: sql<string>`COALESCE(${groupNameCte.groupName}, '')`,
      missedWeeks: sql<number>`COALESCE(${missedWeeksCte.missedCount}, 0)::int`,
      loanBalancePesewas: sql<number>`ROUND(${loans.loanBalance}::numeric * 100)::int`,
      lastPaymentDate: sql<string | null>`${lastPaymentCte.lastDate}`,
    })
    .from(loans)
    .innerJoin(borrowers, eq(loans.borrowerId, borrowers.id))
    .leftJoin(missedWeeksCte, eq(loans.id, missedWeeksCte.loanId))
    .leftJoin(lastPaymentCte, eq(loans.borrowerId, lastPaymentCte.borrowerId))
    .leftJoin(groupNameCte, eq(loans.borrowerId, groupNameCte.borrowerId))
    .where(and(eq(loans.externalStatus, 'DEFAULTED'), isNull(loans.deletedAt)));

  const mapped: DefaulterAggregateRow[] = rows.map((row) => ({
    loanId: row.loanId,
    borrowerId: row.borrowerId,
    borrowerName: row.borrowerName,
    community: row.community,
    groupName: row.groupName,
    missedWeeks: Number(row.missedWeeks),
    outstandingPesewas: Number(row.loanBalancePesewas),
    lastPaymentDate: row.lastPaymentDate ?? null,
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
}

/** Count of all DEFAULTED non-deleted loans in the database. */
export async function countDefaultedLoans(tx = getDb()): Promise<number> {
  if (!isDatabaseEnabled()) {
    return 0;
  }
  const [row] = await tx
    .select({ total: count() })
    .from(loans)
    .where(and(eq(loans.externalStatus, 'DEFAULTED'), isNull(loans.deletedAt)));
  return Number(row?.total ?? 0);
}
