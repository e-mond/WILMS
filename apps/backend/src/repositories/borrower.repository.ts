import { and, count, desc, eq, inArray, isNull, lt, or, notExists } from 'drizzle-orm';
import { BORROWER_STATUS } from '@wilms/shared-contracts';
import { uuidv7 } from 'uuidv7';
import type { WilmsDb } from '../db/client.js';
import { getDb } from '../db/client.js';
import { borrowerAdminFees } from '../db/schema/borrower-admin-fees.js';
import { borrowers } from '../db/schema/borrowers.js';
import type { BorrowerRecord, BorrowerStatus } from '../db/store.js';
import { MAX_LIST_PAGE_SIZE, MAX_UNPAGINATED_LIST_ROWS } from '../http/list-pagination.js';
import type { CursorPayload } from '../http/cursor-pagination.js';

export interface BorrowerListOptions {
  limit?: number;
  offset?: number;
  status?: BorrowerStatus;
  cursor?: CursorPayload | null;
}

type BorrowerProfile = BorrowerRecord['profile'];

function rowToRecord(row: typeof borrowers.$inferSelect): BorrowerRecord {
  const profile = (row.profile ?? {}) as BorrowerProfile;

  return {
    id: row.id,
    fullName: row.fullName,
    phone: row.phone,
    idType: row.idType,
    idNumber: row.idNumber,
    status: row.status as BorrowerStatus,
    hasActiveLoan: row.hasActiveLoan,
    groupName: row.groupName,
    groupId: row.groupId ?? undefined,
    community: row.community,
    registeredAt: row.registeredAt.toISOString(),
    registeredByOfficerId: row.registeredByUserId,
    profile: {
      ...profile,
      photoUploadId: row.photoUploadId ?? profile.photoUploadId,
      guarantorPhotoUploadId: row.guarantorPhotoUploadId ?? profile.guarantorPhotoUploadId,
      idDocumentUploadId: row.idDocumentUploadId ?? profile.idDocumentUploadId,
    },
    rejectionReason: row.rejectionReason ?? undefined,
  };
}

function recordToInsert(record: BorrowerRecord) {
  return {
    id: record.id,
    fullName: record.fullName,
    phone: record.phone,
    idType: record.idType as typeof borrowers.$inferInsert.idType,
    idNumber: record.idNumber,
    status: record.status as typeof borrowers.$inferInsert.status,
    hasActiveLoan: record.hasActiveLoan,
    groupId: record.groupId ?? null,
    groupName: record.groupName,
    community: record.community,
    registeredAt: new Date(record.registeredAt),
    registeredByUserId: record.registeredByOfficerId,
    rejectionReason: record.rejectionReason ?? null,
    profile: record.profile,
    photoUploadId: record.profile.photoUploadId ?? null,
    guarantorPhotoUploadId: record.profile.guarantorPhotoUploadId ?? null,
  };
}

function borrowerListWhere(status?: BorrowerStatus) {
  const clauses = [isNull(borrowers.deletedAt)];
  if (status) {
    clauses.push(eq(borrowers.status, status as typeof borrowers.$inferSelect.status));
  }
  return clauses.length === 1 ? clauses[0]! : and(...clauses);
}

export async function countBorrowers(status?: BorrowerStatus): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ total: count() })
    .from(borrowers)
    .where(borrowerListWhere(status));
  return Number(row?.total ?? 0);
}

export async function listBorrowers(options: BorrowerListOptions = {}): Promise<BorrowerRecord[]> {
  const db = getDb();
  const limit =
    options.limit !== undefined
      ? Math.min(options.limit, MAX_LIST_PAGE_SIZE)
      : MAX_UNPAGINATED_LIST_ROWS;

  if (options.cursor) {
    const cursorDate = new Date(options.cursor.v);
    const rows = await db
      .select()
      .from(borrowers)
      .where(
        and(
          borrowerListWhere(options.status),
          or(
            lt(borrowers.registeredAt, cursorDate),
            and(eq(borrowers.registeredAt, cursorDate), lt(borrowers.id, options.cursor.id)),
          ),
        ),
      )
      .orderBy(desc(borrowers.registeredAt), desc(borrowers.id))
      .limit(limit);
    return rows.map(rowToRecord);
  }

  const offset = options.offset ?? 0;
  const rows = await db
    .select()
    .from(borrowers)
    .where(borrowerListWhere(options.status))
    .orderBy(desc(borrowers.registeredAt), desc(borrowers.id))
    .limit(limit)
    .offset(offset);

  return rows.map(rowToRecord);
}

export async function listApprovedBorrowersWithoutAdminFee(
  limit = MAX_UNPAGINATED_LIST_ROWS,
): Promise<BorrowerRecord[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(borrowers)
    .where(
      and(
        isNull(borrowers.deletedAt),
        eq(borrowers.status, BORROWER_STATUS.APPROVED as typeof borrowers.$inferSelect.status),
        notExists(
          db
            .select({ borrowerId: borrowerAdminFees.borrowerId })
            .from(borrowerAdminFees)
            .where(eq(borrowerAdminFees.borrowerId, borrowers.id)),
        ),
      ),
    )
    .orderBy(borrowers.fullName)
    .limit(limit);

  return rows.map(rowToRecord);
}

export async function getBorrower(id: string): Promise<BorrowerRecord | undefined> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(borrowers)
    .where(eq(borrowers.id, id))
    .limit(1);

  if (!row || row.deletedAt) {
    return undefined;
  }

  return rowToRecord(row);
}

export async function getBorrowersByIds(ids: string[]): Promise<BorrowerRecord[]> {
  if (ids.length === 0) {
    return [];
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(borrowers)
    .where(and(inArray(borrowers.id, ids), isNull(borrowers.deletedAt)));

  return rows.map(rowToRecord);
}

export async function saveBorrower(record: BorrowerRecord, tx?: WilmsDb): Promise<BorrowerRecord> {
  const db = tx ?? getDb();
  const values = recordToInsert(record);
  const existing = await getBorrower(record.id);

  if (existing) {
    await db
      .update(borrowers)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(eq(borrowers.id, record.id));
  } else {
    await db.insert(borrowers).values(values);
  }

  return record;
}

export async function deleteBorrower(id: string): Promise<boolean> {
  const db = getDb();
  const result = await db
    .update(borrowers)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(borrowers.id, id));

  return (result.rowCount ?? 0) > 0;
}

export async function assignBorrowerToGroup(
  borrowerId: string,
  group: { id: string; displayName: string },
): Promise<void> {
  const db = getDb();
  await db
    .update(borrowers)
    .set({
      groupId: group.id,
      groupName: group.displayName,
      updatedAt: new Date(),
    })
    .where(eq(borrowers.id, borrowerId));
}

export function nextBorrowerId(): string {
  return uuidv7();
}
