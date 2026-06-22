/**
 * P14.3B Phase 4C.2 — Reconciliation persistence (no business logic).
 */
import { and, desc, eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import type { WilmsDb } from '../db/client.js';
import { getDb } from '../db/client.js';
import { financialReconciliations } from '../db/schema/financial-reconciliations.js';
import type { ReconciliationSnapshot } from '../domain/reconciliation/types.js';

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === '23505'
  );
}

export async function insertReconciliation(
  snapshot: ReconciliationSnapshot,
  tx: WilmsDb = getDb(),
) {
  const id = uuidv7();
  const submittedAt = new Date(snapshot.submittedAt);

  try {
    const [row] = await tx
      .insert(financialReconciliations)
      .values({
        id,
        collectorUserId: snapshot.collectorUserId,
        reconciliationDate: snapshot.reconciliationDate,
        expectedDuePesewas: snapshot.expectedDuePesewas,
        systemRecordedPesewas: snapshot.systemRecordedPesewas,
        physicalCashPesewas: snapshot.physicalCashPesewas,
        primaryVariancePesewas: snapshot.primaryVariancePesewas,
        collectionDeltaPesewas: snapshot.collectionDeltaPesewas,
        varianceClass: snapshot.varianceClass,
        varianceFlagged: snapshot.varianceFlagged,
        thresholdPercent: snapshot.thresholdPercent,
        comment: snapshot.comment,
        status: snapshot.status,
        submittedAt,
      })
      .returning();

    return row!;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error('DUPLICATE:Reconciliation already submitted for this collector and date.');
    }
    throw error;
  }
}

export async function findReconciliationById(id: string, tx: WilmsDb = getDb()) {
  const [row] = await tx
    .select()
    .from(financialReconciliations)
    .where(eq(financialReconciliations.id, id))
    .limit(1);

  return row;
}

export async function findSubmittedReconciliationByCollectorAndDate(
  collectorUserId: string,
  reconciliationDate: string,
  tx: WilmsDb = getDb(),
) {
  const [row] = await tx
    .select()
    .from(financialReconciliations)
    .where(
      and(
        eq(financialReconciliations.collectorUserId, collectorUserId),
        eq(financialReconciliations.reconciliationDate, reconciliationDate),
        eq(financialReconciliations.status, 'SUBMITTED'),
      ),
    )
    .limit(1);

  return row;
}

export async function listReconciliations(
  filter?: { collectorUserId?: string },
  tx: WilmsDb = getDb(),
) {
  if (filter?.collectorUserId) {
    return tx
      .select()
      .from(financialReconciliations)
      .where(eq(financialReconciliations.collectorUserId, filter.collectorUserId))
      .orderBy(desc(financialReconciliations.submittedAt));
  }

  return tx
    .select()
    .from(financialReconciliations)
    .orderBy(desc(financialReconciliations.submittedAt));
}
