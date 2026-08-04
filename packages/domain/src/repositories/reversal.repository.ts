/**
 * P14.3B Phase 3C.1 — Reversal persistence layer.
 *
 * Persistence-agnostic repository: no HTTP or RBAC.
 * Optimistic locking via version column on execute transition.
 */
import { and, eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import type { WilmsDb } from '../db/client.js';
import { getDb } from '../db/client.js';
import { financialAdjustments } from '../db/schema/financial-adjustments.js';
import {
  financialReversals,
  reversalHistory,
} from '../db/schema/financial-reversals.js';
import { ledgerEntries } from '../db/schema/ledger-entries.js';

export type ReversalSourceType = 'PAYMENT' | 'ADJUSTMENT' | 'DISBURSEMENT';
export type ReversalHistoryEvent = 'CREATED' | 'EXECUTED' | 'REJECTED' | 'LEDGER_POSTED';

/** Returns executed reversal for source if one exists (duplicate guard). */
export async function findExecutedReversalBySource(
  sourceType: ReversalSourceType,
  sourceId: string,
  tx: WilmsDb = getDb(),
) {
  const [row] = await tx
    .select()
    .from(financialReversals)
    .where(
      and(
        eq(financialReversals.sourceType, sourceType),
        eq(financialReversals.sourceId, sourceId),
        eq(financialReversals.status, 'EXECUTED'),
      ),
    )
    .limit(1);

  return row;
}

/**
 * Detects approved PAYMENT_CORRECTION adjustment that would conflict with payment reversal.
 * Adjustments do not store payment_id — match loan, borrower, amount, type.
 */
export async function hasApprovedPaymentCorrectionConflict(
  input: {
    borrowerId: string;
    loanId: string;
    amountPesewas: number;
  },
  tx: WilmsDb = getDb(),
): Promise<boolean> {
  const rows = await tx
    .select({ id: financialAdjustments.id })
    .from(financialAdjustments)
    .where(
      and(
        eq(financialAdjustments.borrowerId, input.borrowerId),
        eq(financialAdjustments.loanId, input.loanId),
        eq(financialAdjustments.type, 'PAYMENT_CORRECTION'),
        eq(financialAdjustments.status, 'APPROVED'),
        eq(financialAdjustments.amountPesewas, input.amountPesewas),
      ),
    )
    .limit(1);

  return rows.length > 0;
}

/** Loads the REPAYMENT ledger row linked to a payment (reversal target). */
export async function findRepaymentLedgerByPaymentId(paymentId: string, tx: WilmsDb = getDb()) {
  const [row] = await tx
    .select()
    .from(ledgerEntries)
    .where(and(eq(ledgerEntries.paymentId, paymentId), eq(ledgerEntries.entryType, 'REPAYMENT')))
    .limit(1);

  return row;
}

export async function insertReversal(
  input: {
    sourceType: ReversalSourceType;
    sourceId: string;
    loanId: string;
    borrowerId: string;
    amountPesewas: number;
    reason: string;
    requestedByUserId: string;
    requestedAt: Date;
  },
  tx: WilmsDb = getDb(),
) {
  const [row] = await tx
    .insert(financialReversals)
    .values({
      id: uuidv7(),
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      loanId: input.loanId,
      borrowerId: input.borrowerId,
      amountPesewas: input.amountPesewas,
      reason: input.reason,
      status: 'PENDING',
      requestedByUserId: input.requestedByUserId,
      requestedAt: input.requestedAt,
    })
    .returning();

  return row!;
}

/** Atomically marks reversal EXECUTED with balance snapshot fields. */
export async function executeReversalRow(
  input: {
    reversalId: string;
    expectedVersion: number;
    executedByUserId: string;
    beforeBalancePesewas: number;
    afterBalancePesewas: number;
    deltaPesewas: number;
  },
  tx: WilmsDb = getDb(),
) {
  const executedAt = new Date();
  const result = await tx
    .update(financialReversals)
    .set({
      status: 'EXECUTED',
      executedByUserId: input.executedByUserId,
      executedAt,
      beforeBalancePesewas: input.beforeBalancePesewas,
      afterBalancePesewas: input.afterBalancePesewas,
      deltaPesewas: input.deltaPesewas,
      updatedAt: executedAt,
      version: input.expectedVersion + 1,
    })
    .where(
      and(
        eq(financialReversals.id, input.reversalId),
        eq(financialReversals.status, 'PENDING'),
        eq(financialReversals.version, input.expectedVersion),
      ),
    )
    .returning();

  if (result.length === 0) {
    throw new Error('CONFLICT:Reversal was modified by another request.');
  }

  return result[0]!;
}

export async function appendReversalHistory(
  input: {
    reversalId: string;
    eventType: ReversalHistoryEvent;
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
    .insert(reversalHistory)
    .values({
      id: uuidv7(),
      reversalId: input.reversalId,
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

export async function findReversalById(id: string, tx: WilmsDb = getDb()) {
  const [row] = await tx.select().from(financialReversals).where(eq(financialReversals.id, id)).limit(1);
  return row;
}
