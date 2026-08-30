import { and, count, eq, gt, isNull, ne, sql } from 'drizzle-orm';
import { getDb, isDatabaseEnabled } from '../db/client.js';
import { borrowers } from '../db/schema/borrowers.js';
import { groups, groupMembers } from '../db/schema/groups.js';
import { loans } from '../db/schema/loans.js';
import { loanSchedules } from '../db/schema/loan-schedules.js';
import { payments } from '../db/schema/payments.js';

export interface MissedPaymentAggregateRow {
  loanId: string;
  borrowerId: string;
  borrowerName: string;
  community: string;
  groupName: string;
  missedWeeks: number;
  outstandingPesewas: number;
  lastPaymentDate: string | null;
  loanStatus: string;
}

export interface MissedPaymentAggregateSummary {
  totalMissedBorrowers: number;
  totalOutstandingPesewas: number;
}

/**
 * Active loans with at least one MISSED schedule week (what missed-payment alerts describe).
 */
export async function queryMissedPaymentAggregates(
  tx = getDb(),
): Promise<{
  rows: MissedPaymentAggregateRow[];
  summary: MissedPaymentAggregateSummary;
} | null> {
  if (!isDatabaseEnabled()) {
    return null;
  }

  const missedWeeksCte = tx
    .select({
      loanId: loanSchedules.loanId,
      missedCount: count().as('missed_count'),
    })
    .from(loanSchedules)
    .where(eq(loanSchedules.status, 'MISSED'))
    .groupBy(loanSchedules.loanId)
    .as('missed_cte');

  const lastPaymentCte = tx
    .select({
      borrowerId: payments.borrowerId,
      lastDate: sql<string>`MAX(${payments.paymentDate})`.as('last_date'),
    })
    .from(payments)
    .where(ne(payments.status, 'REVERSED'))
    .groupBy(payments.borrowerId)
    .as('last_payment_cte');

  const groupNameCte = tx
    .select({
      borrowerId: groupMembers.borrowerId,
      groupName: sql<string>`COALESCE(${groups.displayName}, ${groups.name})`,
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
      loanStatus: loans.externalStatus,
    })
    .from(loans)
    .innerJoin(borrowers, eq(loans.borrowerId, borrowers.id))
    .innerJoin(missedWeeksCte, eq(loans.id, missedWeeksCte.loanId))
    .leftJoin(lastPaymentCte, eq(loans.borrowerId, lastPaymentCte.borrowerId))
    .leftJoin(groupNameCte, eq(loans.borrowerId, groupNameCte.borrowerId))
    .where(
      and(
        eq(loans.externalStatus, 'ACTIVE'),
        isNull(loans.deletedAt),
        gt(sql`COALESCE(${missedWeeksCte.missedCount}, 0)`, 0),
      ),
    );

  const mapped: MissedPaymentAggregateRow[] = rows.map((row) => ({
    loanId: row.loanId,
    borrowerId: row.borrowerId,
    borrowerName: row.borrowerName,
    community: row.community,
    groupName: row.groupName,
    missedWeeks: Number(row.missedWeeks),
    outstandingPesewas: Number(row.loanBalancePesewas),
    lastPaymentDate: row.lastPaymentDate ?? null,
    loanStatus: row.loanStatus,
  }));

  const totalOutstandingPesewas = mapped.reduce(
    (sum, row) => sum + row.outstandingPesewas,
    0,
  );

  return {
    rows: mapped,
    summary: {
      totalMissedBorrowers: mapped.length,
      totalOutstandingPesewas,
    },
  };
}
