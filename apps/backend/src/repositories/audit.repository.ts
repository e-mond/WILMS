import { desc } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { getDb } from '../db/client.js';
import { auditEntries } from '../db/schema/audit.js';
import type { CreateAuditEntryInput } from '../infrastructure/audit/audit-log.js';

const ACTION_MAP = {
  'borrower.registered': 'BORROWER_REGISTERED',
  'borrower.approved': 'BORROWER_APPROVED',
  'borrower.rejected': 'BORROWER_REJECTED',
  'borrower.blacklisted': 'BORROWER_BLACKLISTED',
  'borrower.registration-deleted': 'BORROWER_REGISTERED',
  'payment.recorded': 'PAYMENT_RECORDED',
  'payment.edited': 'PAYMENT_EDITED',
  'loan.created': 'LOAN_CREATED',
  'loan.approved': 'LOAN_APPROVED',
  'loan.rejected': 'LOAN_REJECTED',
  'loan.disbursed': 'LOAN_DISBURSED',
  'adjustment.requested': 'ADJUSTMENT_REQUESTED',
  'adjustment.approved': 'ADJUSTMENT_APPROVED',
  'adjustment.rejected': 'ADJUSTMENT_REJECTED',
} as const satisfies Record<string, string>;

const TARGET_MAP = {
  borrower: 'BORROWER',
  payment: 'PAYMENT',
  user: 'USER',
  group: 'GROUP',
  loan: 'LOAN',
  adjustment: 'ADJUSTMENT',
} as const satisfies Record<string, string>;

export async function appendAuditEntry(
  entry: CreateAuditEntryInput,
): Promise<{ id: string; createdAt: string } & CreateAuditEntryInput> {
  const db = getDb();
  const id = uuidv7();
  const createdAt = new Date().toISOString();
  const action =
    ACTION_MAP[entry.action as keyof typeof ACTION_MAP] ?? ('SETTINGS_EXPORTED' as const);
  const targetEntityType =
    TARGET_MAP[entry.targetEntityType as keyof typeof TARGET_MAP] ?? ('SETTINGS' as const);

  await db.insert(auditEntries).values({
    id,
    action,
    actorId: entry.actorId,
    actorDisplayName: entry.actorDisplayName ?? null,
    targetEntityId: entry.targetEntityId,
    targetEntityType,
    reason: entry.reason ?? null,
    createdAt: new Date(createdAt),
  });

  return { ...entry, id, createdAt };
}

export async function listAuditEntries(limit = 50): Promise<
  Array<{
    id: string;
    action: string;
    actorId: string;
    actorDisplayName?: string;
    targetEntityId: string;
    targetEntityType: string;
    reason?: string;
    createdAt: string;
  }>
> {
  const db = getDb();
  const rows = await db
    .select()
    .from(auditEntries)
    .orderBy(desc(auditEntries.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    action: row.action.toLowerCase().replace(/_/g, '.'),
    actorId: row.actorId,
    actorDisplayName: row.actorDisplayName ?? undefined,
    targetEntityId: row.targetEntityId,
    targetEntityType: row.targetEntityType.toLowerCase(),
    reason: row.reason ?? undefined,
    createdAt: row.createdAt.toISOString(),
  }));
}
