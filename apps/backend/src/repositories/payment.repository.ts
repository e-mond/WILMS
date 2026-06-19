import { and, eq } from 'drizzle-orm';
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
      ),
    )
    .limit(1);

  return row ? rowToRecord(row) : undefined;
}

export function nextPaymentId(): string {
  return uuidv7();
}
