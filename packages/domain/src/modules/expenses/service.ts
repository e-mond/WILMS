import { eq, inArray, isNull, sql, and } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { formatExpenseDisplayId } from '@wilms/shared-utils';
import { isDatabaseEnabled, getDb, runInTransaction } from '../../db/client.js';
import { expenses } from '../../db/schema/expenses.js';
import { users } from '../../db/schema/users.js';
import { appendAuditEntry } from '../../infrastructure/audit/audit-log.js';
import * as ledgerRepo from '../../repositories/ledger.repository.js';
import { pesewasToDecimal } from '../../domain/money.js';

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
  const approved = items.filter((entry) => entry.status === 'APPROVED');
  return {
    pendingCount: pending.length,
    approvedTotalPesewas: approved.reduce((sum, entry) => sum + entry.amountPesewas, 0),
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

export async function listExpenses(filter?: {
  recordedByUserId?: string;
}): Promise<ExpenseListResponse> {
  const items = await loadExpenses();
  const scoped = filter?.recordedByUserId
    ? items.filter((entry) => entry.recordedById === filter.recordedByUserId)
    : items;
  return {
    expenses: scoped,
    summary: buildSummary(scoped),
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
    status: 'PENDING',
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
      status: 'PENDING',
    });
  } else {
    memoryExpenses.unshift(created);
  }

  appendAuditEntry({
    action: 'expense.submitted',
    actorId: input.recordedById,
    actorDisplayName: input.recordedByName,
    targetEntityId: created.id,
    targetEntityType: 'expense',
    reason: `${created.categoryLabel} ${input.amountPesewas} pesewas (pending approval)`,
  });

  return { ...created };
}

export async function reviewExpense(
  id: string,
  input: { status: 'APPROVED' | 'REJECTED'; reviewNote?: string },
  reviewerUserId: string,
): Promise<ExpenseRecord> {
  if (input.status !== 'APPROVED' && input.status !== 'REJECTED') {
    throw new Error('VALIDATION:Expense review status must be APPROVED or REJECTED.');
  }

  if (input.status === 'REJECTED' && !input.reviewNote?.trim()) {
    throw new Error('VALIDATION:A rejection reason is required.');
  }

  if (isDatabaseEnabled()) {
    return runInTransaction(async (tx) => {
      const [row] = await tx.select().from(expenses).where(eq(expenses.id, id)).limit(1);
      if (!row || row.deletedAt) {
        throw new Error('NOT_FOUND');
      }

      if (row.status !== 'PENDING') {
        // Idempotent: same decision again is a no-op success; conflicting decision fails.
        if (row.status === input.status) {
          return rowToRecord(row);
        }
        throw new Error('VALIDATION:Only pending expenses can be reviewed.');
      }

      if (row.recordedByUserId === reviewerUserId) {
        throw new Error('FORBIDDEN:You cannot approve or reject an expense you recorded.');
      }

      const now = new Date();
      await tx
        .update(expenses)
        .set({
          status: input.status,
          reviewNote: input.reviewNote?.trim() ?? null,
          reviewedByUserId: reviewerUserId,
          reviewedAt: now,
          updatedAt: now,
        })
        .where(and(eq(expenses.id, id), eq(expenses.status, 'PENDING')));

      if (input.status === 'APPROVED') {
        await ledgerRepo.appendLedgerEntry(
          {
            entryType: 'ADJUSTMENT',
            amountDecimal: pesewasToDecimal(row.amountPesewas),
            description: `Operating expense: ${row.categoryLabel}`,
            actorUserId: reviewerUserId,
            metadata: {
              kind: 'OPERATING_EXPENSE',
              expenseId: row.id,
              category: row.category,
              expenseDate: row.expenseDate,
              affectsLoanPrincipal: false,
              affectsPoolCapital: false,
            },
          },
          tx,
        );
      }

      appendAuditEntry({
        action: input.status === 'APPROVED' ? 'expense.approved' : 'expense.rejected',
        actorId: reviewerUserId,
        targetEntityId: id,
        targetEntityType: 'expense',
        reason: input.reviewNote?.trim() || input.status,
      });

      const [updated] = await tx.select().from(expenses).where(eq(expenses.id, id)).limit(1);
      return rowToRecord(updated!);
    });
  }

  const index = memoryExpenses.findIndex((entry) => entry.id === id);
  if (index === -1) {
    throw new Error('NOT_FOUND');
  }

  const current = memoryExpenses[index]!;
  if (current.status !== 'PENDING') {
    if (current.status === input.status) {
      return { ...current };
    }
    throw new Error('VALIDATION:Only pending expenses can be reviewed.');
  }

  if (current.recordedById === reviewerUserId) {
    throw new Error('FORBIDDEN:You cannot approve or reject an expense you recorded.');
  }

  const updated = { ...current, status: input.status };
  memoryExpenses[index] = updated;

  appendAuditEntry({
    action: input.status === 'APPROVED' ? 'expense.approved' : 'expense.rejected',
    actorId: reviewerUserId,
    targetEntityId: id,
    targetEntityType: 'expense',
    reason: input.reviewNote?.trim() || input.status,
  });

  return { ...updated };
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function getExpenseSummary(filter?: {
  recordedByUserId?: string;
}): Promise<{
  todayPesewas: number;
  weekPesewas: number;
  monthPesewas: number;
  yearPesewas: number;
}> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  if (isDatabaseEnabled()) {
    const db = getDb();
    const conditions = [
      isNull(expenses.deletedAt),
      eq(expenses.status, 'APPROVED'),
      sql`${expenses.expenseDate} >= ${isoDate(startOfYear)}`,
    ];
    if (filter?.recordedByUserId) {
      conditions.push(eq(expenses.recordedByUserId, filter.recordedByUserId));
    }

    const [row] = await db
      .select({
        todayPesewas: sql<number>`COALESCE(SUM(CASE WHEN ${expenses.expenseDate} >= ${isoDate(startOfDay)} THEN ${expenses.amountPesewas} ELSE 0 END), 0)::int`,
        weekPesewas: sql<number>`COALESCE(SUM(CASE WHEN ${expenses.expenseDate} >= ${isoDate(startOfWeek)} THEN ${expenses.amountPesewas} ELSE 0 END), 0)::int`,
        monthPesewas: sql<number>`COALESCE(SUM(CASE WHEN ${expenses.expenseDate} >= ${isoDate(startOfMonth)} THEN ${expenses.amountPesewas} ELSE 0 END), 0)::int`,
        yearPesewas: sql<number>`COALESCE(SUM(${expenses.amountPesewas}), 0)::int`,
      })
      .from(expenses)
      .where(and(...conditions));

    return {
      todayPesewas: Number(row?.todayPesewas ?? 0),
      weekPesewas: Number(row?.weekPesewas ?? 0),
      monthPesewas: Number(row?.monthPesewas ?? 0),
      yearPesewas: Number(row?.yearPesewas ?? 0),
    };
  }

  const { expenses: items } = await listExpenses(filter);
  const approved = items.filter((entry) => entry.status === 'APPROVED');
  const sumSince = (date: Date) =>
    approved
      .filter((entry) => new Date(entry.expenseDate) >= date)
      .reduce((total, entry) => total + entry.amountPesewas, 0);

  return {
    todayPesewas: sumSince(startOfDay),
    weekPesewas: sumSince(startOfWeek),
    monthPesewas: sumSince(startOfMonth),
    yearPesewas: sumSince(startOfYear),
  };
}

/** Test helper */
export function __resetExpensesForTests(): void {
  memoryExpenses.length = 0;
}
