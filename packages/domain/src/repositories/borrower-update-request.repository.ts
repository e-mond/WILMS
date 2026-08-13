import { and, desc, eq, inArray } from 'drizzle-orm';
import { isDatabaseEnabled, getDb } from '../db/client.js';
import { borrowerUpdateRequests } from '../db/schema/borrower-update-requests.js';

export const BORROWER_UPDATE_FIELDS = [
  'PHONE',
  'ALTERNATE_PHONE',
  'NAME',
  'ADDRESS',
  'COMMUNITY',
  'CITY',
  'BUSINESS_ADDRESS',
  'GUARANTOR_PHONE',
  'GUARANTOR_NAME',
] as const;

export type BorrowerUpdateField = (typeof BORROWER_UPDATE_FIELDS)[number];

export const BORROWER_UPDATE_STATUS = {
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type BorrowerUpdateStatus =
  (typeof BORROWER_UPDATE_STATUS)[keyof typeof BORROWER_UPDATE_STATUS];

export interface BorrowerUpdateRequestRecord {
  id: string;
  borrowerId: string;
  field: BorrowerUpdateField;
  beforeValue: string;
  afterValue: string;
  reason: string;
  status: BorrowerUpdateStatus;
  requestedByUserId: string;
  reviewedByUserId: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  appliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapRow(row: typeof borrowerUpdateRequests.$inferSelect): BorrowerUpdateRequestRecord {
  return {
    id: row.id,
    borrowerId: row.borrowerId,
    field: row.field as BorrowerUpdateField,
    beforeValue: row.beforeValue,
    afterValue: row.afterValue,
    reason: row.reason,
    status: row.status as BorrowerUpdateStatus,
    requestedByUserId: row.requestedByUserId,
    reviewedByUserId: row.reviewedByUserId,
    reviewNote: row.reviewNote,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    appliedAt: row.appliedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listBorrowerUpdateRequests(filter?: {
  requestedByUserId?: string;
  statuses?: BorrowerUpdateStatus[];
  borrowerId?: string;
}): Promise<BorrowerUpdateRequestRecord[]> {
  if (!isDatabaseEnabled()) {
    return [];
  }

  const db = getDb();
  const conditions = [];
  if (filter?.requestedByUserId) {
    conditions.push(eq(borrowerUpdateRequests.requestedByUserId, filter.requestedByUserId));
  }
  if (filter?.borrowerId) {
    conditions.push(eq(borrowerUpdateRequests.borrowerId, filter.borrowerId));
  }
  if (filter?.statuses?.length) {
    conditions.push(inArray(borrowerUpdateRequests.status, filter.statuses));
  }

  const rows = await db
    .select()
    .from(borrowerUpdateRequests)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(borrowerUpdateRequests.createdAt));

  return rows.map(mapRow);
}

export async function getBorrowerUpdateRequest(
  id: string,
): Promise<BorrowerUpdateRequestRecord | undefined> {
  if (!isDatabaseEnabled()) {
    return undefined;
  }

  const db = getDb();
  const [row] = await db
    .select()
    .from(borrowerUpdateRequests)
    .where(eq(borrowerUpdateRequests.id, id))
    .limit(1);
  return row ? mapRow(row) : undefined;
}

export async function insertBorrowerUpdateRequest(
  record: BorrowerUpdateRequestRecord,
): Promise<BorrowerUpdateRequestRecord> {
  const db = getDb();
  await db.insert(borrowerUpdateRequests).values({
    id: record.id,
    borrowerId: record.borrowerId,
    field: record.field,
    beforeValue: record.beforeValue,
    afterValue: record.afterValue,
    reason: record.reason,
    status: record.status,
    requestedByUserId: record.requestedByUserId,
    reviewedByUserId: record.reviewedByUserId,
    reviewNote: record.reviewNote,
    reviewedAt: record.reviewedAt ? new Date(record.reviewedAt) : null,
    appliedAt: record.appliedAt ? new Date(record.appliedAt) : null,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
  });
  return record;
}

export async function updateBorrowerUpdateRequest(
  id: string,
  patch: Partial<
    Pick<
      BorrowerUpdateRequestRecord,
      'status' | 'reviewedByUserId' | 'reviewNote' | 'reviewedAt' | 'appliedAt'
    >
  >,
): Promise<BorrowerUpdateRequestRecord | undefined> {
  const db = getDb();
  const [row] = await db
    .update(borrowerUpdateRequests)
    .set({
      ...(patch.status ? { status: patch.status } : {}),
      ...(patch.reviewedByUserId !== undefined ? { reviewedByUserId: patch.reviewedByUserId } : {}),
      ...(patch.reviewNote !== undefined ? { reviewNote: patch.reviewNote } : {}),
      ...(patch.reviewedAt !== undefined
        ? { reviewedAt: patch.reviewedAt ? new Date(patch.reviewedAt) : null }
        : {}),
      ...(patch.appliedAt !== undefined
        ? { appliedAt: patch.appliedAt ? new Date(patch.appliedAt) : null }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(borrowerUpdateRequests.id, id))
    .returning();
  return row ? mapRow(row) : undefined;
}
