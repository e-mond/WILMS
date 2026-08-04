/**
 * P14.3B Phase 2 — Adjustment history persistence (append-only).
 *
 * Records immutable before/after/delta values for each lifecycle event.
 * Used for audit reconstruction and financial safety verification.
 */
import { desc, eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import type { WilmsDb } from '../db/client.js';
import { getDb } from '../db/client.js';
import { adjustmentHistory } from '../db/schema/financial-adjustments.js';

export type AdjustmentHistoryEvent = 'CREATED' | 'APPROVED' | 'REJECTED' | 'LEDGER_POSTED';

export async function appendAdjustmentHistory(
  input: {
    adjustmentId: string;
    eventType: AdjustmentHistoryEvent;
    actorUserId: string;
    actorDisplayName: string;
    reason?: string;
    beforeValuePesewas?: number;
    afterValuePesewas?: number;
    deltaPesewas?: number;
    metadata?: Record<string, unknown>;
    recordedAt?: Date;
  },
  tx: WilmsDb = getDb(),
) {
  const [row] = await tx
    .insert(adjustmentHistory)
    .values({
      id: uuidv7(),
      adjustmentId: input.adjustmentId,
      eventType: input.eventType,
      actorUserId: input.actorUserId,
      actorDisplayName: input.actorDisplayName,
      reason: input.reason ?? null,
      beforeValuePesewas: input.beforeValuePesewas ?? null,
      afterValuePesewas: input.afterValuePesewas ?? null,
      deltaPesewas: input.deltaPesewas ?? null,
      metadata: input.metadata ?? null,
      recordedAt: input.recordedAt ?? new Date(),
    })
    .returning();

  return row!;
}

export async function listHistoryForAdjustment(adjustmentId: string, tx: WilmsDb = getDb()) {
  return tx
    .select()
    .from(adjustmentHistory)
    .where(eq(adjustmentHistory.adjustmentId, adjustmentId))
    .orderBy(desc(adjustmentHistory.recordedAt));
}
