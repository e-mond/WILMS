import { and, eq, inArray, isNull } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import type { WilmsDb } from '../db/client.js';
import { getDb } from '../db/client.js';
import { borrowers } from '../db/schema/borrowers.js';
import type { BorrowerRecord, BorrowerStatus } from '../db/store.js';

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

export async function listBorrowers(): Promise<BorrowerRecord[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(borrowers)
    .where(isNull(borrowers.deletedAt));

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
