import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { getDb, isDatabaseEnabled } from '../db/client.js';
import { isUndefinedTableError } from '../lib/db-errors.js';
import { holidayRequests } from '../db/schema/holiday-requests.js';

export type HolidayRequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'APPLIED';

export interface HolidayRequestRecord {
  id: string;
  name: string;
  holidayDate: string;
  endDate: string | null;
  reason: string | null;
  scope: string;
  branch: string | null;
  status: HolidayRequestStatus;
  requestedByUserId: string;
  reviewedByUserId: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  organizationHolidayId: string | null;
  appliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapRow(row: typeof holidayRequests.$inferSelect): HolidayRequestRecord {
  return {
    id: row.id,
    name: row.name,
    holidayDate: row.holidayDate,
    endDate: row.endDate,
    reason: row.reason,
    scope: row.scope,
    branch: row.branch,
    status: row.status as HolidayRequestStatus,
    requestedByUserId: row.requestedByUserId,
    reviewedByUserId: row.reviewedByUserId,
    reviewNote: row.reviewNote,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    organizationHolidayId: row.organizationHolidayId,
    appliedAt: row.appliedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listHolidayRequests(filter?: {
  requestedByUserId?: string;
  statuses?: HolidayRequestStatus[];
}): Promise<HolidayRequestRecord[]> {
  if (!isDatabaseEnabled()) {
    return [];
  }

  const db = getDb();

  try {
    const conditions = [];
    if (filter?.requestedByUserId) {
      conditions.push(eq(holidayRequests.requestedByUserId, filter.requestedByUserId));
    }
    if (filter?.statuses?.length) {
      conditions.push(inArray(holidayRequests.status, filter.statuses));
    }

    const rows = await db
      .select()
      .from(holidayRequests)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(holidayRequests.createdAt), asc(holidayRequests.holidayDate));

    return rows.map(mapRow);
  } catch (error) {
    if (isUndefinedTableError(error)) {
      console.warn(
        '[holiday-requests] table missing — holiday request APIs will return empty until migrations are applied.',
      );
      return [];
    }
    throw error;
  }
}

export async function findHolidayRequestById(id: string): Promise<HolidayRequestRecord | null> {
  if (!isDatabaseEnabled()) {
    return null;
  }

  const db = getDb();

  try {
    const [row] = await db.select().from(holidayRequests).where(eq(holidayRequests.id, id)).limit(1);
    return row ? mapRow(row) : null;
  } catch (error) {
    if (isUndefinedTableError(error)) {
      return null;
    }
    throw error;
  }
}

export async function insertHolidayRequest(
  input: Omit<HolidayRequestRecord, 'createdAt' | 'updatedAt'> & {
    createdAt?: string;
    updatedAt?: string;
  },
): Promise<HolidayRequestRecord> {
  const db = getDb();
  const [row] = await db
    .insert(holidayRequests)
    .values({
      id: input.id,
      name: input.name,
      holidayDate: input.holidayDate,
      endDate: input.endDate,
      reason: input.reason,
      scope: input.scope,
      branch: input.branch,
      status: input.status,
      requestedByUserId: input.requestedByUserId,
      reviewedByUserId: input.reviewedByUserId,
      reviewNote: input.reviewNote,
      reviewedAt: input.reviewedAt ? new Date(input.reviewedAt) : null,
      organizationHolidayId: input.organizationHolidayId,
      appliedAt: input.appliedAt ? new Date(input.appliedAt) : null,
    })
    .returning();

  return mapRow(row!);
}

export async function updateHolidayRequest(
  id: string,
  patch: Partial<
    Pick<
      HolidayRequestRecord,
      | 'name'
      | 'holidayDate'
      | 'endDate'
      | 'reason'
      | 'scope'
      | 'branch'
      | 'status'
      | 'reviewedByUserId'
      | 'reviewNote'
      | 'reviewedAt'
      | 'organizationHolidayId'
      | 'appliedAt'
    >
  >,
): Promise<HolidayRequestRecord | null> {
  const db = getDb();
  const [row] = await db
    .update(holidayRequests)
    .set({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.holidayDate !== undefined ? { holidayDate: patch.holidayDate } : {}),
      ...(patch.endDate !== undefined ? { endDate: patch.endDate } : {}),
      ...(patch.reason !== undefined ? { reason: patch.reason } : {}),
      ...(patch.scope !== undefined ? { scope: patch.scope } : {}),
      ...(patch.branch !== undefined ? { branch: patch.branch } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.reviewedByUserId !== undefined
        ? { reviewedByUserId: patch.reviewedByUserId }
        : {}),
      ...(patch.reviewNote !== undefined ? { reviewNote: patch.reviewNote } : {}),
      ...(patch.reviewedAt !== undefined
        ? { reviewedAt: patch.reviewedAt ? new Date(patch.reviewedAt) : null }
        : {}),
      ...(patch.organizationHolidayId !== undefined
        ? { organizationHolidayId: patch.organizationHolidayId }
        : {}),
      ...(patch.appliedAt !== undefined
        ? { appliedAt: patch.appliedAt ? new Date(patch.appliedAt) : null }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(holidayRequests.id, id))
    .returning();

  return row ? mapRow(row) : null;
}
