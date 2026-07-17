import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import type { WilmsDb } from '../db/client.js';
import { getDb } from '../db/client.js';
import { loans } from '../db/schema/loans.js';
import { groupMembers, groups } from '../db/schema/groups.js';
import { LOAN_LIFECYCLE, toExternalStatus } from '../domain/loan/lifecycle.js';
import { pesewasToDecimal } from '../domain/money.js';

export interface CreateLoanRecordInput {
  borrowerId: string;
  amountPesewas: number;
  durationWeeks: number;
  weeklyPaymentPesewas: number;
  paymentDay: string;
  startDate: string;
  cycleBatch: string;
  createdByUserId: string;
  loanPoolId?: string;
}

export async function insertLoan(input: CreateLoanRecordInput, tx: WilmsDb = getDb()) {
  const id = uuidv7();
  const principal = pesewasToDecimal(input.amountPesewas);
  const installment = pesewasToDecimal(input.weeklyPaymentPesewas);

  const [row] = await tx
    .insert(loans)
    .values({
      id,
      borrowerId: input.borrowerId,
      lifecycleStatus: LOAN_LIFECYCLE.PENDING_APPROVAL,
      externalStatus: toExternalStatus(LOAN_LIFECYCLE.PENDING_APPROVAL),
      principalAmount: principal,
      approvedAmount: principal,
      disbursedAmount: '0',
      installmentAmount: installment,
      loanBalance: principal,
      durationWeeks: input.durationWeeks,
      paymentDay: input.paymentDay,
      startDate: input.startDate,
      cycleBatch: input.cycleBatch,
      createdByUserId: input.createdByUserId,
      loanPoolId: input.loanPoolId ?? null,
    })
    .returning();

  return row!;
}

export async function findLoanById(id: string, tx: WilmsDb = getDb()) {
  const [row] = await tx.select().from(loans).where(eq(loans.id, id)).limit(1);
  return row && !row.deletedAt ? row : undefined;
}

export async function listLoans(filter?: { externalStatus?: string }, tx: WilmsDb = getDb()) {
  const conditions = [isNull(loans.deletedAt)];
  if (filter?.externalStatus) {
    conditions.push(eq(loans.externalStatus, filter.externalStatus as never));
  }
  return tx
    .select()
    .from(loans)
    .where(and(...conditions));
}

export async function borrowerHasOpenLoan(borrowerId: string, tx: WilmsDb = getDb()) {
  const rows = await tx
    .select()
    .from(loans)
    .where(and(eq(loans.borrowerId, borrowerId), isNull(loans.deletedAt)));

  return rows.some(
    (row) =>
      row.externalStatus === 'PENDING_DISBURSEMENT' || row.externalStatus === 'ACTIVE',
  );
}

export async function updateLoanLifecycle(
  input: {
    loanId: string;
    expectedVersion: number;
    lifecycleStatus: string;
    loanBalance?: string;
    disbursedAmount?: string;
    approvedByUserId?: string;
    disbursedByUserId?: string;
    rejectionReason?: string;
    loanPoolId?: string;
  },
  tx: WilmsDb = getDb(),
) {
  const externalStatus = toExternalStatus(input.lifecycleStatus as never);
  const result = await tx
    .update(loans)
    .set({
      lifecycleStatus: input.lifecycleStatus as never,
      externalStatus,
      loanBalance: input.loanBalance,
      disbursedAmount: input.disbursedAmount,
      approvedByUserId: input.approvedByUserId,
      disbursedByUserId: input.disbursedByUserId,
      rejectionReason: input.rejectionReason,
      ...(input.loanPoolId !== undefined ? { loanPoolId: input.loanPoolId } : {}),
      updatedAt: new Date(),
      version: input.expectedVersion + 1,
    })
    .where(and(eq(loans.id, input.loanId), eq(loans.version, input.expectedVersion)))
    .returning();

  if (result.length === 0) {
    throw new Error('CONFLICT:Loan was modified by another request.');
  }

  return result[0]!;
}

export async function listBorrowerLoans(borrowerId: string, tx: WilmsDb = getDb()) {
  return tx
    .select()
    .from(loans)
    .where(and(eq(loans.borrowerId, borrowerId), isNull(loans.deletedAt)));
}

export async function sumLedgerRepayments(loanId: string, tx: WilmsDb = getDb()) {
  const { ledgerEntries } = await import('../db/schema/ledger-entries.js');
  const rows = await tx.select().from(ledgerEntries).where(eq(ledgerEntries.loanId, loanId));
  return rows
    .filter((row) => row.entryType === 'REPAYMENT')
    .reduce((total, row) => total + Number(row.amount) * 100, 0);
}

/**
 * Active loans for borrowers in groups assigned to the collector.
 */
export async function listPortfolioLoansForCollector(
  collectorUserId: string,
  tx: WilmsDb = getDb(),
) {
  const collectorGroups = await tx
    .select({ id: groups.id })
    .from(groups)
    .where(and(eq(groups.collectorUserId, collectorUserId), isNull(groups.deletedAt)));

  const groupIds = collectorGroups.map((group) => group.id);
  if (groupIds.length === 0) {
    return [];
  }

  const members = await tx
    .select({ borrowerId: groupMembers.borrowerId })
    .from(groupMembers)
    .where(and(inArray(groupMembers.groupId, groupIds), isNull(groupMembers.removedAt)));

  const borrowerIds = [...new Set(members.map((member) => member.borrowerId))];
  if (borrowerIds.length === 0) {
    return [];
  }

  const rows = await tx
    .select({
      paymentDay: loans.paymentDay,
      installmentAmount: loans.installmentAmount,
      externalStatus: loans.externalStatus,
    })
    .from(loans)
    .where(
      and(
        inArray(loans.borrowerId, borrowerIds),
        isNull(loans.deletedAt),
        eq(loans.externalStatus, 'ACTIVE'),
      ),
    );

  const { decimalToPesewas } = await import('../domain/money.js');

  return rows.map((row) => ({
    paymentDay: row.paymentDay,
    weeklyPaymentPesewas: decimalToPesewas(row.installmentAmount),
    externalStatus: row.externalStatus,
  }));
}

/**
 * One-query expected weekly collection totals per collector (active loans in assigned groups).
 * Replaces N× listPortfolioLoansForCollector for dashboard performance.
 */
export async function sumExpectedWeeklyByCollector(
  tx: WilmsDb = getDb(),
): Promise<Map<string, number>> {
  const result = await tx.execute(sql`
    SELECT
      g.collector_user_id AS collector_id,
      COALESCE(SUM(ROUND(l.installment_amount::numeric * 100))::int, 0) AS expected_pesewas
    FROM groups g
    INNER JOIN group_members gm
      ON gm.group_id = g.id AND gm.removed_at IS NULL
    INNER JOIN loans l
      ON l.borrower_id = gm.borrower_id
      AND l.deleted_at IS NULL
      AND l.external_status = 'ACTIVE'
    WHERE g.deleted_at IS NULL
      AND g.collector_user_id IS NOT NULL
    GROUP BY g.collector_user_id
  `);

  const map = new Map<string, number>();
  for (const row of result.rows as { collector_id?: string; expected_pesewas?: number }[]) {
    if (row.collector_id) {
      map.set(row.collector_id, Number(row.expected_pesewas ?? 0));
    }
  }
  return map;
}
