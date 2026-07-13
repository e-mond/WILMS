import { eq, sql, asc } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import type { WilmsDb } from '../db/client.js';
import { getDb } from '../db/client.js';
import { loanPools, poolAllocations, poolMemberships } from '../db/schema/loan-pools.js';
import type { PoolAllocationTotals } from '../domain/loan-pool/balance.js';
import { derivePoolAggregates } from '../domain/loan-pool/balance.js';

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
  await tx.insert(poolMemberships).values({
    poolId: input.poolId,
    groupId: input.groupId,
    assignedAt: input.assignedAt ?? new Date(),
  });
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
