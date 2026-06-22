import { and, eq, ne } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import type { WilmsDb } from '../db/client.js';
import { getDb } from '../db/client.js';
import { payments } from '../db/schema/payments.js';
import type { PaymentRecord } from '../db/store.js';

export interface PaymentInsertRecord extends PaymentRecord {
  loanId?: string;
  scheduleWeekNumber?: number;
}

function rowToRecord(row: typeof payments.$inferSelect): PaymentRecord {
  return {
    id: row.id,
    borrowerId: row.borrowerId,
    collectorId: row.collectorUserId,
    amountPesewas: row.amountPesewas,
    paymentDate: row.paymentDate,
    recordedAt: row.recordedAt.toISOString(),
    gps: row.gps as PaymentRecord['gps'],
  };
}

export async function findPaymentById(id: string, tx: WilmsDb = getDb()) {
  const [row] = await tx.select().from(payments).where(eq(payments.id, id)).limit(1);
  return row;
}

/**
 * Marks a confirmed payment as reversed without mutating amount/date (append-only accounting).
 */
export async function markPaymentReversed(
  input: {
    paymentId: string;
    expectedVersion: number;
    reversedByUserId: string;
    reversalId: string;
  },
  tx: WilmsDb = getDb(),
) {
  const reversedAt = new Date();
  const result = await tx
    .update(payments)
    .set({
      status: 'REVERSED',
      reversedAt,
      reversedByUserId: input.reversedByUserId,
      reversalId: input.reversalId,
      updatedAt: reversedAt,
      version: input.expectedVersion + 1,
    })
    .where(
      and(
        eq(payments.id, input.paymentId),
        eq(payments.status, 'CONFIRMED'),
        eq(payments.version, input.expectedVersion),
      ),
    )
    .returning();

  if (result.length === 0) {
    throw new Error('CONFLICT:Payment was modified by another request.');
  }

  return result[0]!;
}

export async function listPayments(tx: WilmsDb = getDb()): Promise<PaymentRecord[]> {
  const rows = await tx.select().from(payments);
  return rows.map(rowToRecord);
}

export async function appendPayment(
  record: PaymentInsertRecord,
  tx: WilmsDb = getDb(),
): Promise<PaymentRecord> {
  await tx.insert(payments).values({
    id: record.id,
    borrowerId: record.borrowerId,
    collectorUserId: record.collectorId,
    loanId: record.loanId ?? null,
    scheduleWeekNumber: record.scheduleWeekNumber ?? null,
    amountPesewas: record.amountPesewas,
    paymentDate: record.paymentDate,
    recordedAt: new Date(record.recordedAt),
    status: 'CONFIRMED',
    gps: record.gps ?? null,
  });

  return record;
}

export async function findSameDayPayment(
  borrowerId: string,
  collectorId: string,
  paymentDate: string,
  tx: WilmsDb = getDb(),
): Promise<PaymentRecord | undefined> {
  const [row] = await tx
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.borrowerId, borrowerId),
        eq(payments.collectorUserId, collectorId),
        eq(payments.paymentDate, paymentDate),
      ),
    )
    .limit(1);

  return row ? rowToRecord(row) : undefined;
}

export async function findDuplicatePayment(
  input: {
    borrowerId: string;
    paymentDate: string;
    amountPesewas: number;
  },
  tx: WilmsDb = getDb(),
): Promise<PaymentRecord | undefined> {
  const [row] = await tx
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.borrowerId, input.borrowerId),
        eq(payments.paymentDate, input.paymentDate),
        eq(payments.amountPesewas, input.amountPesewas),
        ne(payments.status, 'REVERSED'),
      ),
    )
    .limit(1);

  return row ? rowToRecord(row) : undefined;
}

export function nextPaymentId(): string {
  return uuidv7();
}

export async function listConfirmedPaymentsForCollectorOnDate(
  collectorUserId: string,
  paymentDate: string,
  tx: WilmsDb = getDb(),
) {
  return tx
    .select({
      amountPesewas: payments.amountPesewas,
      status: payments.status,
    })
    .from(payments)
    .where(
      and(
        eq(payments.collectorUserId, collectorUserId),
        eq(payments.paymentDate, paymentDate),
      ),
    );
}
