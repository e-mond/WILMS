import { eq, inArray, isNull } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { formatExpenseDisplayId } from '@wilms/shared-utils';
import { isDatabaseEnabled, getDb } from '../../db/client.js';
import { expenses } from '../../db/schema/expenses.js';
import { users } from '../../db/schema/users.js';

export interface ExpenseRecord {
  id: string;
  displayId: string;
  category: string;
  categoryLabel: string;
  amountPesewas: number;
  expenseDate: string;
  reason: string;
  notes?: string;
  receiptFileName?: string;
  receiptUploadId?: string;
  gpsLabel?: string;
  recordedById: string;
  recordedByName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface ExpenseListResponse {
  expenses: ExpenseRecord[];
  summary: {
    pendingCount: number;
    approvedTotalPesewas: number;
    pendingTotalPesewas: number;
  };
}

const memoryExpenses: ExpenseRecord[] = [];

function rowToRecord(
  row: typeof expenses.$inferSelect,
  recordedByName = 'Collector',
  sequence = 1,
): ExpenseRecord {
  return {
    id: row.id,
    displayId: formatExpenseDisplayId({
      expenseDate: row.expenseDate,
      createdAt: row.createdAt.toISOString(),
      sequence,
    }),
    category: row.category,
    categoryLabel: row.categoryLabel,
    amountPesewas: row.amountPesewas,
    expenseDate: row.expenseDate,
    reason: row.reason,
    notes: row.notes ?? undefined,
    receiptUploadId: row.receiptUploadId ?? undefined,
    gpsLabel: row.gpsLabel ?? undefined,
    recordedById: row.recordedByUserId,
    recordedByName,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

function buildSummary(items: ExpenseRecord[]): ExpenseListResponse['summary'] {
  const pending = items.filter((entry) => entry.status === 'PENDING');
  return {
    pendingCount: pending.length,
    approvedTotalPesewas: items.reduce((sum, entry) => sum + entry.amountPesewas, 0),
    pendingTotalPesewas: pending.reduce((sum, entry) => sum + entry.amountPesewas, 0),
  };
}

async function loadExpenses(): Promise<ExpenseRecord[]> {
  if (!isDatabaseEnabled()) {
    return memoryExpenses.map((entry) => ({ ...entry }));
  }

  const db = getDb();
  const rows = await db.select().from(expenses).where(isNull(expenses.deletedAt));
  const recorderIds = [...new Set(rows.map((row) => row.recordedByUserId))];
  const recorderNames = new Map<string, string>();

  if (recorderIds.length > 0) {
    const recorders = await db
      .select({ id: users.id, displayName: users.displayName })
      .from(users)
      .where(inArray(users.id, recorderIds));

    for (const recorder of recorders) {
      recorderNames.set(recorder.id, recorder.displayName);
    }
  }

  const yearCounters = new Map<string, number>();
  return rows.map((row) => {
    const year = row.expenseDate.slice(0, 4);
    const nextSequence = (yearCounters.get(year) ?? 0) + 1;
    yearCounters.set(year, nextSequence);
    return rowToRecord(row, recorderNames.get(row.recordedByUserId) ?? 'Collector', nextSequence);
  });
}

export async function listExpenses(): Promise<ExpenseListResponse> {
  const items = await loadExpenses();
  return {
    expenses: items,
    summary: buildSummary(items),
  };
}

export async function createExpense(input: {
  category: string;
  amountPesewas: number;
  expenseDate: string;
  reason: string;
  notes?: string;
  receiptFileName?: string;
  receiptUploadId?: string;
  gpsLabel?: string;
  recordedById: string;
  recordedByName: string;
}): Promise<ExpenseRecord> {
  const now = new Date();
  const created: ExpenseRecord = {
    id: uuidv7(),
    displayId: formatExpenseDisplayId({ expenseDate: input.expenseDate, createdAt: now.toISOString() }),
    category: input.category,
    categoryLabel: input.category.replace(/_/g, ' '),
    amountPesewas: input.amountPesewas,
    expenseDate: input.expenseDate,
    reason: input.reason,
    notes: input.notes,
    receiptFileName: input.receiptFileName,
    receiptUploadId: input.receiptUploadId,
    gpsLabel: input.gpsLabel,
    recordedById: input.recordedById,
    recordedByName: input.recordedByName,
    status: 'APPROVED',
    createdAt: now.toISOString(),
  };

  if (isDatabaseEnabled()) {
    const db = getDb();
    await db.insert(expenses).values({
      id: created.id,
      category: input.category as typeof expenses.$inferInsert.category,
      categoryLabel: created.categoryLabel,
      amountPesewas: input.amountPesewas,
      expenseDate: input.expenseDate,
      reason: input.reason,
      notes: input.notes ?? null,
      receiptUploadId: input.receiptUploadId ?? null,
      gpsLabel: input.gpsLabel ?? null,
      recordedByUserId: input.recordedById,
      status: 'APPROVED',
      reviewedByUserId: input.recordedById,
      reviewedAt: now,
    });
  } else {
    memoryExpenses.unshift(created);
  }

  return { ...created };
}

export async function reviewExpense(
  id: string,
  input: { status: 'APPROVED' | 'REJECTED'; reviewNote?: string },
  reviewerUserId: string,
): Promise<ExpenseRecord> {
  if (isDatabaseEnabled()) {
    const db = getDb();
    const [row] = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
    if (!row || row.deletedAt) {
      throw new Error('NOT_FOUND');
    }

    await db
      .update(expenses)
      .set({
        status: input.status,
        reviewNote: input.reviewNote ?? null,
        reviewedByUserId: reviewerUserId,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(expenses.id, id));

    const [updated] = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
    return rowToRecord(updated!);
  }

  const index = memoryExpenses.findIndex((entry) => entry.id === id);
  if (index === -1) {
    throw new Error('NOT_FOUND');
  }

  const updated = { ...memoryExpenses[index]!, status: input.status };
  memoryExpenses[index] = updated;
  return { ...updated };
}

export async function getExpenseSummary(): Promise<{
  todayPesewas: number;
  weekPesewas: number;
  monthPesewas: number;
  yearPesewas: number;
}> {
  const items = await loadExpenses();
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const sumSince = (date: Date) =>
    items
      .filter((entry) => new Date(entry.expenseDate) >= date)
      .reduce((total, entry) => total + entry.amountPesewas, 0);

  return {
    todayPesewas: sumSince(startOfDay),
    weekPesewas: sumSince(startOfWeek),
    monthPesewas: sumSince(startOfMonth),
    yearPesewas: sumSince(startOfYear),
  };
}
