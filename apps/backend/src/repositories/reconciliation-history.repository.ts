/**
 * P14.3B Phase 4C.2 — Reconciliation history persistence (append-only).
 */
import { desc, eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import type { WilmsDb } from '../db/client.js';
import { getDb } from '../db/client.js';
import { reconciliationHistory } from '../db/schema/financial-reconciliations.js';

export type ReconciliationHistoryEvent = 'SUBMITTED' | 'COMMENT_ADDED';

export async function appendReconciliationHistory(
  input: {
    reconciliationId: string;
    eventType: ReconciliationHistoryEvent;
    actorUserId: string;
    beforeSnapshot?: Record<string, unknown> | null;
    afterSnapshot: Record<string, unknown>;
    reason?: string;
    createdAt?: Date;
  },
  tx: WilmsDb = getDb(),
) {
  const [row] = await tx
    .insert(reconciliationHistory)
    .values({
      id: uuidv7(),
      reconciliationId: input.reconciliationId,
      eventType: input.eventType,
      actorUserId: input.actorUserId,
      beforeSnapshot: input.beforeSnapshot ?? null,
      afterSnapshot: input.afterSnapshot,
      reason: input.reason ?? null,
      createdAt: input.createdAt ?? new Date(),
    })
    .returning();

  return row!;
}

export async function listHistoryForReconciliation(
  reconciliationId: string,
  tx: WilmsDb = getDb(),
) {
  return tx
    .select()
    .from(reconciliationHistory)
    .where(eq(reconciliationHistory.reconciliationId, reconciliationId))
    .orderBy(desc(reconciliationHistory.createdAt));
}
