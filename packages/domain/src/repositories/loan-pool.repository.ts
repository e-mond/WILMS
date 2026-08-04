import { and, eq, sql, asc, notInArray } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import type { WilmsDb } from '../db/client.js';
import { getDb } from '../db/client.js';
import { loanPools, poolAllocations, poolMemberships } from '../db/schema/loan-pools.js';
import { groups } from '../db/schema/groups.js';
import { loans } from '../db/schema/loans.js';
import { payments } from '../db/schema/payments.js';
import type { PoolAllocationTotals } from '../domain/loan-pool/balance.js';
import { derivePoolAggregates } from '../domain/loan-pool/balance.js';
import { decimalToPesewas } from '../domain/money.js';

export async function listPools(tx: WilmsDb = getDb()) {
  return tx.select().from(loanPools).orderBy(asc(loanPools.name));
}

export async function findPoolById(id: string, tx: WilmsDb = getDb()) {
  const [row] = await tx.select().from(loanPools).where(eq(loanPools.id, id)).limit(1);
  return row;
}

export async function listRecentAllocations(poolId: string, limit = 10, tx: WilmsDb = getDb()) {
  return tx
    .select()
    .from(poolAllocations)
    .where(eq(poolAllocations.poolId, poolId))
    .orderBy(sql`${poolAllocations.recordedAt} DESC`)
    .limit(limit);
}

export async function sumAllocationTotals(poolId: string, tx: WilmsDb = getDb()): Promise<PoolAllocationTotals> {
  const rows = await tx
    .select({
      allocationType: poolAllocations.allocationType,
      total: sql<number>`coalesce(sum(${poolAllocations.amountPesewas}), 0)::int`,
    })
    .from(poolAllocations)
    .where(eq(poolAllocations.poolId, poolId))
    .groupBy(poolAllocations.allocationType);

  const totals: PoolAllocationTotals = {
    disbursedPesewas: 0,
    collectedPesewas: 0,
    replenishmentPesewas: 0,
    adjustmentPesewas: 0,
  };

  for (const row of rows) {
    switch (row.allocationType) {
      case 'DISBURSEMENT':
        totals.disbursedPesewas = row.total;
        break;
      case 'REPAYMENT':
        totals.collectedPesewas = row.total;
        break;
      case 'REPLENISHMENT':
        totals.replenishmentPesewas = row.total;
        break;
      case 'ADJUSTMENT':
        totals.adjustmentPesewas = row.total;
        break;
      default:
        break;
    }
  }

  return totals;
}

export async function findPoolIdForGroup(groupId: string, tx: WilmsDb = getDb()): Promise<string | undefined> {
  const [row] = await tx
    .select({ poolId: poolMemberships.poolId })
    .from(poolMemberships)
    .where(eq(poolMemberships.groupId, groupId))
    .limit(1);

  return row?.poolId;
}

export async function hasAllocationForLoan(
  poolId: string,
  loanId: string,
  allocationType: 'DISBURSEMENT' | 'REPAYMENT',
  tx: WilmsDb = getDb(),
): Promise<boolean> {
  const [row] = await tx
    .select({ id: poolAllocations.id })
    .from(poolAllocations)
    .where(
      and(
        eq(poolAllocations.poolId, poolId),
        eq(poolAllocations.loanId, loanId),
        eq(poolAllocations.allocationType, allocationType),
      ),
    )
    .limit(1);

  return Boolean(row);
}

export async function countPoolMemberships(poolId: string, tx: WilmsDb = getDb()) {
  const [row] = await tx
    .select({ count: sql<number>`count(*)::int` })
    .from(poolMemberships)
    .where(eq(poolMemberships.poolId, poolId));
  return row?.count ?? 0;
}

export interface InsertPoolInput {
  id?: string;
  name: string;
  region: string;
  source: string;
  capitalPesewas: number;
  disbursedPesewas: number;
  collectedPesewas: number;
  outstandingPesewas: number;
  utilisationPercent: number;
  status: 'ACTIVE' | 'NEAR_FULL' | 'LAUNCHING';
  groupCount: number;
  cycleLabel: string;
  lastReplenishedAt: Date;
  repaymentRatePercent: string;
}

export async function insertPool(input: InsertPoolInput, tx: WilmsDb = getDb()) {
  const id = input.id ?? uuidv7();
  const [row] = await tx
    .insert(loanPools)
    .values({ ...input, id })
    .returning();
  return row!;
}

export async function insertMembership(
  input: { poolId: string; groupId: string; assignedAt?: Date },
  tx: WilmsDb = getDb(),
) {
  await tx
    .insert(poolMemberships)
    .values({
      poolId: input.poolId,
      groupId: input.groupId,
      assignedAt: input.assignedAt ?? new Date(),
    })
    .onConflictDoNothing();
}

export async function listMembershipGroupIds(poolId: string, tx: WilmsDb = getDb()): Promise<string[]> {
  const rows = await tx
    .select({ groupId: poolMemberships.groupId })
    .from(poolMemberships)
    .where(eq(poolMemberships.poolId, poolId));
  return rows.map((row) => row.groupId);
}

export async function listUnassignedGroupOptions(
  tx: WilmsDb = getDb(),
): Promise<{ id: string; name: string; community: string }[]> {
  const assigned = await tx.select({ groupId: poolMemberships.groupId }).from(poolMemberships);
  const assignedIds = assigned.map((row) => row.groupId);

  const rows =
    assignedIds.length === 0
      ? await tx
          .select({
            id: groups.id,
            name: groups.displayName,
            community: groups.community,
          })
          .from(groups)
          .where(sql`${groups.deletedAt} IS NULL`)
          .orderBy(asc(groups.displayName))
      : await tx
          .select({
            id: groups.id,
            name: groups.displayName,
            community: groups.community,
          })
          .from(groups)
          .where(and(sql`${groups.deletedAt} IS NULL`, notInArray(groups.id, assignedIds)))
          .orderBy(asc(groups.displayName));

  return rows;
}

export async function groupExists(groupId: string, tx: WilmsDb = getDb()): Promise<boolean> {
  const [row] = await tx
    .select({ id: groups.id })
    .from(groups)
    .where(and(eq(groups.id, groupId), sql`${groups.deletedAt} IS NULL`))
    .limit(1);
  return Boolean(row);
}

export async function appendAllocation(
  input: {
    poolId: string;
    allocationType: 'DISBURSEMENT' | 'REPAYMENT' | 'REPLENISHMENT' | 'ADJUSTMENT';
    amountPesewas: number;
    loanId?: string;
    borrowerId?: string;
    paymentId?: string;
    description: string;
    actorUserId?: string;
    recordedAt?: Date;
  },
  tx: WilmsDb = getDb(),
) {
  const id = uuidv7();
  await tx.insert(poolAllocations).values({
    id,
    poolId: input.poolId,
    allocationType: input.allocationType,
    amountPesewas: input.amountPesewas,
    loanId: input.loanId ?? null,
    borrowerId: input.borrowerId ?? null,
    paymentId: input.paymentId ?? null,
    description: input.description,
    actorUserId: input.actorUserId ?? null,
    recordedAt: input.recordedAt ?? new Date(),
  });
  return id;
}

export async function updatePoolAggregates(
  poolId: string,
  input: {
    disbursedPesewas: number;
    collectedPesewas: number;
    outstandingPesewas: number;
    utilisationPercent: number;
    repaymentRatePercent: string;
    status: 'ACTIVE' | 'NEAR_FULL' | 'LAUNCHING';
    groupCount: number;
  },
  tx: WilmsDb = getDb(),
) {
  await tx
    .update(loanPools)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(loanPools.id, poolId));
}

/** Recompute denormalized pool totals from append-only allocation rows. */
export async function refreshPoolAggregates(poolId: string, tx: WilmsDb = getDb()) {
  const pool = await findPoolById(poolId, tx);
  if (!pool) {
    return;
  }

  const totals = await sumAllocationTotals(poolId, tx);
  const groupCount = await countPoolMemberships(poolId, tx);
  const aggregates = derivePoolAggregates({
    capitalPesewas: pool.capitalPesewas,
    totals,
  });

  await updatePoolAggregates(
    poolId,
    {
      disbursedPesewas: aggregates.disbursedPesewas,
      collectedPesewas: aggregates.collectedPesewas,
      outstandingPesewas: aggregates.outstandingPesewas,
      utilisationPercent: aggregates.utilisationPercent,
      repaymentRatePercent: aggregates.repaymentRatePercent.toFixed(1),
      status: aggregates.status,
      groupCount,
    },
    tx,
  );
}

export async function hasLoansMissingPoolAllocations(tx: WilmsDb = getDb()): Promise<boolean> {
  const missingDisbursement = await tx
    .select({ id: loans.id })
    .from(loans)
    .where(
      and(
        sql`${loans.loanPoolId} IS NOT NULL`,
        sql`${loans.externalStatus} <> 'PENDING_DISBURSEMENT'`,
        sql`${loans.deletedAt} IS NULL`,
        sql`NOT EXISTS (
          SELECT 1 FROM ${poolAllocations}
          WHERE ${poolAllocations.poolId} = ${loans.loanPoolId}
            AND ${poolAllocations.loanId} = ${loans.id}
            AND ${poolAllocations.allocationType} = 'DISBURSEMENT'
        )`,
      ),
    )
    .limit(1);

  if (missingDisbursement.length > 0) {
    return true;
  }

  const missingRepayment = await tx
    .select({ id: payments.id })
    .from(payments)
    .innerJoin(loans, eq(payments.loanId, loans.id))
    .where(
      and(
        sql`${loans.loanPoolId} IS NOT NULL`,
        eq(payments.status, 'CONFIRMED'),
        sql`NOT EXISTS (
          SELECT 1 FROM ${poolAllocations}
          WHERE ${poolAllocations.paymentId} = ${payments.id}
            AND ${poolAllocations.allocationType} = 'REPAYMENT'
        )`,
      ),
    )
    .limit(1);

  return missingRepayment.length > 0;
}

/** Backfill missing DISBURSEMENT/REPAYMENT allocation rows from loan portfolio data. */
export async function reconcilePoolAllocationsFromLoans(tx: WilmsDb = getDb()): Promise<void> {
  const disbursedLoans = await tx
    .select({
      id: loans.id,
      borrowerId: loans.borrowerId,
      loanPoolId: loans.loanPoolId,
      disbursedAmount: loans.disbursedAmount,
      principalAmount: loans.principalAmount,
      updatedAt: loans.updatedAt,
    })
    .from(loans)
    .where(
      and(
        sql`${loans.loanPoolId} IS NOT NULL`,
        sql`${loans.externalStatus} <> 'PENDING_DISBURSEMENT'`,
        sql`${loans.deletedAt} IS NULL`,
      ),
    );

  for (const loan of disbursedLoans) {
    if (!loan.loanPoolId) {
      continue;
    }

    const hasDisbursement = await hasAllocationForLoan(loan.loanPoolId, loan.id, 'DISBURSEMENT', tx);
    if (!hasDisbursement) {
      const amountPesewas =
        decimalToPesewas(loan.disbursedAmount) || decimalToPesewas(loan.principalAmount);

      if (amountPesewas > 0) {
        await appendAllocation(
          {
            poolId: loan.loanPoolId,
            allocationType: 'DISBURSEMENT',
            amountPesewas,
            loanId: loan.id,
            borrowerId: loan.borrowerId,
            description: `Backfill disbursement for ${loan.id.slice(-8)}`,
            recordedAt: loan.updatedAt,
          },
          tx,
        );
      }
    }
  }

  const confirmedPayments = await tx
    .select({
      id: payments.id,
      borrowerId: payments.borrowerId,
      loanId: payments.loanId,
      amountPesewas: payments.amountPesewas,
      recordedAt: payments.recordedAt,
      loanPoolId: loans.loanPoolId,
    })
    .from(payments)
    .innerJoin(loans, eq(payments.loanId, loans.id))
    .where(and(sql`${loans.loanPoolId} IS NOT NULL`, eq(payments.status, 'CONFIRMED')));

  for (const payment of confirmedPayments) {
    if (!payment.loanPoolId || !payment.loanId) {
      continue;
    }

    const [existing] = await tx
      .select({ id: poolAllocations.id })
      .from(poolAllocations)
      .where(
        and(
          eq(poolAllocations.paymentId, payment.id),
          eq(poolAllocations.allocationType, 'REPAYMENT'),
        ),
      )
      .limit(1);

    if (!existing) {
      await appendAllocation(
        {
          poolId: payment.loanPoolId,
          allocationType: 'REPAYMENT',
          amountPesewas: payment.amountPesewas,
          loanId: payment.loanId,
          borrowerId: payment.borrowerId,
          paymentId: payment.id,
          description: `Backfill repayment for ${payment.id.slice(-8)}`,
          recordedAt: payment.recordedAt,
        },
        tx,
      );
    }
  }

  const pools = await listPools(tx);
  for (const pool of pools) {
    await refreshPoolAggregates(pool.id, tx);
  }
}
