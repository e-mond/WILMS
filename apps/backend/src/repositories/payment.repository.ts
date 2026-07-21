import { and, count, eq, inArray, ne, sql } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import type { WilmsDb } from '../db/client.js';
import { getDb } from '../db/client.js';
import { payments } from '../db/schema/payments.js';
import type { PaymentRecord } from '../db/store.js';
import { MAX_LIST_PAGE_SIZE, MAX_UNPAGINATED_LIST_ROWS } from '../http/list-pagination.js';

export interface PaymentListOptions {
  limit?: number;
  offset?: number;
  borrowerIds?: string[];
}

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
    gps: (row.gps ?? { lat: 0, lng: 0, verified: false }) as PaymentRecord['gps'],
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

export async function countPayments(borrowerIds?: string[]): Promise<number> {
  const db = getDb();
  const where =
    borrowerIds && borrowerIds.length > 0
      ? inArray(payments.borrowerId, borrowerIds)
      : undefined;
  const [row] = await db
    .select({ total: count() })
    .from(payments)
    .where(where);
  return Number(row?.total ?? 0);
}

export async function listPayments(
  options: PaymentListOptions = {},
  tx: WilmsDb = getDb(),
): Promise<PaymentRecord[]> {
  const limit =
    options.limit !== undefined
      ? Math.min(options.limit, MAX_LIST_PAGE_SIZE)
      : MAX_UNPAGINATED_LIST_ROWS;
  const offset = options.offset ?? 0;

  const rows = await tx
    .select()
    .from(payments)
    .where(
      options.borrowerIds && options.borrowerIds.length > 0
        ? and(inArray(payments.borrowerId, options.borrowerIds), ne(payments.status, 'REVERSED'))
        : ne(payments.status, 'REVERSED'),
    )
    .limit(limit)
    .offset(offset);
  return rows.map(rowToRecord);
}

export async function sumPaymentsByBorrowerIds(
  borrowerIds: string[],
  tx: WilmsDb = getDb(),
): Promise<Map<string, number>> {
  if (borrowerIds.length === 0) {
    return new Map();
  }

  const rows = await tx
    .select({
      borrowerId: payments.borrowerId,
      total: sql<number>`COALESCE(SUM(${payments.amountPesewas}), 0)::int`,
    })
    .from(payments)
    .where(and(inArray(payments.borrowerId, borrowerIds), ne(payments.status, 'REVERSED')))
    .groupBy(payments.borrowerId);

  return new Map(rows.map((row) => [row.borrowerId, Number(row.total)]));
}

/** Confirmed (non-reversed) collection totals — avoids listPayments 2000-row cap. */
export async function sumConfirmedPaymentsPesewas(tx: WilmsDb = getDb()): Promise<number> {
  const [row] = await tx
    .select({
      total: sql<number>`COALESCE(SUM(${payments.amountPesewas}), 0)::int`,
    })
    .from(payments)
    .where(ne(payments.status, 'REVERSED'));
  return Number(row?.total ?? 0);
}

export async function sumConfirmedPaymentsSincePesewas(
  paymentDateFromInclusive: string,
  tx: WilmsDb = getDb(),
): Promise<number> {
  const [row] = await tx
    .select({
      total: sql<number>`COALESCE(SUM(${payments.amountPesewas}), 0)::int`,
    })
    .from(payments)
    .where(
      and(ne(payments.status, 'REVERSED'), sql`${payments.paymentDate} >= ${paymentDateFromInclusive}`),
    );
  return Number(row?.total ?? 0);
}

export async function sumConfirmedPaymentsByCollector(
  tx: WilmsDb = getDb(),
): Promise<Map<string, number>> {
  const rows = await tx
    .select({
      collectorId: payments.collectorUserId,
      total: sql<number>`COALESCE(SUM(${payments.amountPesewas}), 0)::int`,
    })
    .from(payments)
    .where(ne(payments.status, 'REVERSED'))
    .groupBy(payments.collectorUserId);

  return new Map(rows.map((row) => [row.collectorId, Number(row.total)]));
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

/** Date-scoped payment list for reports — avoids loading the full payments table. */
export async function listPaymentsForDate(
  paymentDate: string,
  options: { collectorId?: string; limit?: number } = {},
  tx: WilmsDb = getDb(),
): Promise<PaymentRecord[]> {
  const limit = Math.min(options.limit ?? MAX_UNPAGINATED_LIST_ROWS, MAX_UNPAGINATED_LIST_ROWS);
  const conditions = [eq(payments.paymentDate, paymentDate)];
  if (options.collectorId) {
    conditions.push(eq(payments.collectorUserId, options.collectorId));
  }

  const rows = await tx
    .select()
    .from(payments)
    .where(and(...conditions))
    .limit(limit);

  return rows.map(rowToRecord);
}

export async function countPaymentsForDate(
  paymentDate: string,
  options: { collectorId?: string } = {},
  tx: WilmsDb = getDb(),
): Promise<number> {
  const conditions = [eq(payments.paymentDate, paymentDate)];
  if (options.collectorId) {
    conditions.push(eq(payments.collectorUserId, options.collectorId));
  }
  const [row] = await tx
    .select({ total: count() })
    .from(payments)
    .where(and(...conditions));
  return Number(row?.total ?? 0);
}

/** SQL sum of confirmed (non-reversed) payments for a calendar date. */
export async function sumConfirmedPaymentsForDatePesewas(
  paymentDate: string,
  options: { collectorId?: string } = {},
  tx: WilmsDb = getDb(),
): Promise<number> {
  const conditions = [eq(payments.paymentDate, paymentDate), ne(payments.status, 'REVERSED')];
  if (options.collectorId) {
    conditions.push(eq(payments.collectorUserId, options.collectorId));
  }
  const [row] = await tx
    .select({
      total: sql<number>`COALESCE(SUM(${payments.amountPesewas}), 0)::int`,
    })
    .from(payments)
    .where(and(...conditions));
  return Number(row?.total ?? 0);
}

/** Date-range payment list for financial ledger (fail-closed if over safety cap). */
export async function listPaymentsInDateRange(
  options: { fromDate?: string; toDate?: string; limit?: number } = {},
  tx: WilmsDb = getDb(),
): Promise<{ rows: PaymentRecord[]; total: number }> {
  const limit = Math.min(options.limit ?? MAX_UNPAGINATED_LIST_ROWS, MAX_UNPAGINATED_LIST_ROWS);
  const conditions = [];
  if (options.fromDate) {
    conditions.push(sql`${payments.paymentDate} >= ${options.fromDate}`);
  }
  if (options.toDate) {
    conditions.push(sql`${payments.paymentDate} <= ${options.toDate}`);
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [countRow] = await tx.select({ total: count() }).from(payments).where(where);
  const total = Number(countRow?.total ?? 0);

  const rows = await tx
    .select()
    .from(payments)
    .where(where)
    .orderBy(sql`${payments.recordedAt} DESC`)
    .limit(limit);

  return { rows: rows.map(rowToRecord), total };
}
