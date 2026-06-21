/**
 * P14.3B Phase 2 — Financial adjustment persistence.
 *
 * Repository layer remains persistence-agnostic: no HTTP or RBAC concerns.
 * Optimistic locking uses the version column on approve/reject transitions.
 */
import { and, desc, eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import type { WilmsDb } from '../db/client.js';
import { getDb } from '../db/client.js';
import {
  adjustmentReasons,
  financialAdjustments,
} from '../db/schema/financial-adjustments.js';
import type { AdjustmentStatus, AdjustmentType } from '../domain/adjustment/types.js';

export async function insertAdjustment(
  input: {
    type: AdjustmentType;
    borrowerId: string;
    borrowerName: string;
    loanId?: string;
    amountPesewas: number;
    reason: string;
    reasonCode?: string;
    requestedByUserId: string;
    requestedByDisplayName: string;
    requestedAt: Date;
  },
  tx: WilmsDb = getDb(),
) {
  const [row] = await tx
    .insert(financialAdjustments)
    .values({
      id: uuidv7(),
      type: input.type,
      borrowerId: input.borrowerId,
      borrowerName: input.borrowerName,
      loanId: input.loanId ?? null,
      amountPesewas: input.amountPesewas,
      reason: input.reason,
      reasonCode: input.reasonCode ?? null,
      requestedByUserId: input.requestedByUserId,
      requestedByDisplayName: input.requestedByDisplayName,
      requestedAt: input.requestedAt,
      status: 'PENDING',
    })
    .returning();

  return row!;
}

export async function findAdjustmentById(id: string, tx: WilmsDb = getDb()) {
  const [row] = await tx
    .select()
    .from(financialAdjustments)
    .where(eq(financialAdjustments.id, id))
    .limit(1);

  return row;
}

export async function listAdjustmentsByStatus(status: AdjustmentStatus, tx: WilmsDb = getDb()) {
  return tx
    .select()
    .from(financialAdjustments)
    .where(eq(financialAdjustments.status, status))
    .orderBy(desc(financialAdjustments.requestedAt));
}

export async function listAllAdjustments(tx: WilmsDb = getDb()) {
  return tx
    .select()
    .from(financialAdjustments)
    .orderBy(desc(financialAdjustments.requestedAt));
}

/**
 * Atomically transitions a pending adjustment to approved with balance snapshot fields.
 * Throws CONFLICT when expectedVersion does not match (concurrent review).
 */
export async function approveAdjustmentRow(
  input: {
    adjustmentId: string;
    expectedVersion: number;
    reviewedByUserId: string;
    beforeBalancePesewas: number;
    afterBalancePesewas: number;
    deltaPesewas: number;
  },
  tx: WilmsDb = getDb(),
) {
  const reviewedAt = new Date();
  const result = await tx
    .update(financialAdjustments)
    .set({
      status: 'APPROVED',
      reviewedByUserId: input.reviewedByUserId,
      reviewedAt,
      beforeBalancePesewas: input.beforeBalancePesewas,
      afterBalancePesewas: input.afterBalancePesewas,
      deltaPesewas: input.deltaPesewas,
      updatedAt: reviewedAt,
      version: input.expectedVersion + 1,
    })
    .where(
      and(
        eq(financialAdjustments.id, input.adjustmentId),
        eq(financialAdjustments.status, 'PENDING'),
        eq(financialAdjustments.version, input.expectedVersion),
      ),
    )
    .returning();

  if (result.length === 0) {
    throw new Error('CONFLICT:Adjustment was modified by another request.');
  }

  return result[0]!;
}

export async function rejectAdjustmentRow(
  input: {
    adjustmentId: string;
    expectedVersion: number;
    reviewedByUserId: string;
    rejectionReason: string;
  },
  tx: WilmsDb = getDb(),
) {
  const reviewedAt = new Date();
  const result = await tx
    .update(financialAdjustments)
    .set({
      status: 'REJECTED',
      reviewedByUserId: input.reviewedByUserId,
      reviewedAt,
      rejectionReason: input.rejectionReason,
      updatedAt: reviewedAt,
      version: input.expectedVersion + 1,
    })
    .where(
      and(
        eq(financialAdjustments.id, input.adjustmentId),
        eq(financialAdjustments.status, 'PENDING'),
        eq(financialAdjustments.version, input.expectedVersion),
      ),
    )
    .returning();

  if (result.length === 0) {
    throw new Error('CONFLICT:Adjustment was modified by another request.');
  }

  return result[0]!;
}

export async function seedAdjustmentReasons(
  rows: Array<{
    code: string;
    label: string;
    category:
      | 'FEE_CORRECTION'
      | 'INTEREST_CORRECTION'
      | 'ADMINISTRATIVE'
      | 'BALANCE_CORRECTION'
      | 'MANUAL_CORRECTION';
  }>,
  tx: WilmsDb = getDb(),
) {
  for (const row of rows) {
    await tx
      .insert(adjustmentReasons)
      .values({
        id: uuidv7(),
        code: row.code,
        label: row.label,
        category: row.category,
        isActive: true,
      })
      .onConflictDoNothing();
  }
}
