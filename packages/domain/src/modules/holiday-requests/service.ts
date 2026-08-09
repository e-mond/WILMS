import { uuidv7 } from 'uuidv7';
import { isDatabaseEnabled } from '../../db/client.js';
import { createInAppNotification } from '../../infrastructure/notifications/in-app-notify.js';
import type {
  HolidayRequestRecord,
  HolidayRequestStatus,
} from '../../repositories/holiday-request.repository.js';
import { createHoliday } from '../organization-holidays/service.js';

const memoryRequests: HolidayRequestRecord[] = [];

function isoNow(): string {
  return new Date().toISOString();
}

async function notifyRequester(
  userId: string,
  title: string,
  body: string,
  href: string,
): Promise<void> {
  try {
    await createInAppNotification({
      userId,
      event: 'COMMUNICATION',
      title,
      body,
      href,
    });
    const { sendPushToUser } = await import('../notifications/push.service.js');
    await sendPushToUser(userId, {
      title,
      body,
      url: href,
      category: 'holiday',
    });
  } catch {
    // Notification failure must not block holiday workflow.
  }
}

async function notifySupervisors(title: string, body: string, href: string): Promise<void> {
  try {
    if (!isDatabaseEnabled()) {
      return;
    }
    const { listUsers } = await import('../../repositories/user.repository.js');
    const { sendPushToUser } = await import('../notifications/push.service.js');
    const users = await listUsers();
    const recipients = users.filter(
      (user) =>
        (user.role === 'SUPER_ADMIN' || user.role === 'APPROVER') && user.status === 'ACTIVE',
    );
    await Promise.all(
      recipients.map(async (user) => {
        await createInAppNotification({
          userId: user.id,
          event: 'SUPERVISOR_ALERT',
          title,
          body,
          href,
        });
        await sendPushToUser(user.id, {
          title,
          body,
          url: href,
          category: 'holiday',
        });
      }),
    );
  } catch {
    // Ignore missing table or notify failures.
  }
}

function assertDate(value: string, label: string): string {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new Error(`VALIDATION:${label} must be YYYY-MM-DD.`);
  }
  return trimmed;
}

export async function listHolidayRequests(input?: {
  requestedByUserId?: string;
  statuses?: HolidayRequestStatus[];
  scope: 'own' | 'all';
  actorUserId: string;
}): Promise<HolidayRequestRecord[]> {
  const filter =
    input?.scope === 'own'
      ? { requestedByUserId: input.actorUserId, statuses: input.statuses }
      : { requestedByUserId: input?.requestedByUserId, statuses: input?.statuses };

  if (!isDatabaseEnabled()) {
    return memoryRequests
      .filter((entry) => {
        if (filter.requestedByUserId && entry.requestedByUserId !== filter.requestedByUserId) {
          return false;
        }
        if (filter.statuses?.length && !filter.statuses.includes(entry.status)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const { listHolidayRequests: listRows } = await import(
    '../../repositories/holiday-request.repository.js'
  );
  return listRows(filter);
}

export async function createHolidayRequest(input: {
  name: string;
  holidayDate: string;
  endDate?: string | null;
  reason?: string | null;
  scope?: string;
  branch?: string | null;
  requestedByUserId: string;
  submit?: boolean;
}): Promise<HolidayRequestRecord> {
  const name = input.name.trim();
  const holidayDate = assertDate(input.holidayDate, 'Holiday date');
  const endDate = input.endDate ? assertDate(input.endDate, 'End date') : null;

  if (!name) {
    throw new Error('VALIDATION:Holiday name is required.');
  }
  if (endDate && endDate < holidayDate) {
    throw new Error('VALIDATION:End date must be on or after the holiday date.');
  }

  const now = isoNow();
  const record: HolidayRequestRecord = {
    id: uuidv7(),
    name,
    holidayDate,
    endDate,
    reason: input.reason?.trim() || null,
    scope: input.scope?.trim() || 'NATIONAL',
    branch: input.branch?.trim() || null,
    status: input.submit ? 'SUBMITTED' : 'DRAFT',
    requestedByUserId: input.requestedByUserId,
    reviewedByUserId: null,
    reviewNote: null,
    reviewedAt: null,
    organizationHolidayId: null,
    appliedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  if (!isDatabaseEnabled()) {
    memoryRequests.push(record);
  } else {
    const { insertHolidayRequest } = await import(
      '../../repositories/holiday-request.repository.js'
    );
    await insertHolidayRequest(record);
  }

  if (record.status === 'SUBMITTED') {
    await notifySupervisors(
      'Holiday request submitted',
      `${record.name} (${record.holidayDate}) awaits review.`,
      '/settings?section=holidays',
    );
  }

  return record;
}

export async function updateHolidayRequestDraft(
  id: string,
  actorUserId: string,
  input: Partial<{
    name: string;
    holidayDate: string;
    endDate: string | null;
    reason: string | null;
    scope: string;
    branch: string | null;
  }>,
): Promise<HolidayRequestRecord> {
  const existing = await getRequestOrThrow(id);

  if (existing.requestedByUserId !== actorUserId) {
    throw new Error('FORBIDDEN:You can only edit your own holiday requests.');
  }
  if (existing.status !== 'DRAFT') {
    throw new Error('VALIDATION:Only draft holiday requests can be edited.');
  }

  const patch = {
    name: input.name?.trim() ?? existing.name,
    holidayDate: input.holidayDate
      ? assertDate(input.holidayDate, 'Holiday date')
      : existing.holidayDate,
    endDate:
      input.endDate === undefined
        ? existing.endDate
        : input.endDate
          ? assertDate(input.endDate, 'End date')
          : null,
    reason: input.reason === undefined ? existing.reason : input.reason?.trim() || null,
    scope: input.scope?.trim() ?? existing.scope,
    branch:
      input.branch === undefined ? existing.branch : input.branch?.trim() || null,
  };

  if (patch.endDate && patch.endDate < patch.holidayDate) {
    throw new Error('VALIDATION:End date must be on or after the holiday date.');
  }

  return persistUpdate(id, patch);
}

export async function submitHolidayRequest(
  id: string,
  actorUserId: string,
): Promise<HolidayRequestRecord> {
  const existing = await getRequestOrThrow(id);

  if (existing.requestedByUserId !== actorUserId) {
    throw new Error('FORBIDDEN:You can only submit your own holiday requests.');
  }
  if (existing.status !== 'DRAFT') {
    throw new Error('VALIDATION:Only draft holiday requests can be submitted.');
  }

  const updated = await persistUpdate(id, { status: 'SUBMITTED' });
  await notifySupervisors(
    'Holiday request submitted',
    `${updated.name} (${updated.holidayDate}) awaits review.`,
    '/settings?section=holidays',
  );
  return updated;
}

export async function approveHolidayRequest(
  id: string,
  actorUserId: string,
  reviewNote?: string | null,
): Promise<HolidayRequestRecord> {
  const existing = await getRequestOrThrow(id);

  if (existing.requestedByUserId === actorUserId) {
    throw new Error(
      'VALIDATION:You cannot approve a holiday request you created. Ask another authorised approver.',
    );
  }
  if (existing.status !== 'SUBMITTED') {
    throw new Error('VALIDATION:Only submitted holiday requests can be approved.');
  }

  const now = isoNow();
  const updated = await persistUpdate(id, {
    status: 'APPROVED',
    reviewedByUserId: actorUserId,
    reviewNote: reviewNote?.trim() || null,
    reviewedAt: now,
  });

  await notifyRequester(
    updated.requestedByUserId,
    'Holiday request approved',
    `${updated.name} (${updated.holidayDate}) was approved.`,
    '/collector/holidays',
  );

  return applyHolidayRequest(updated.id, actorUserId);
}

export async function rejectHolidayRequest(
  id: string,
  actorUserId: string,
  reviewNote?: string | null,
): Promise<HolidayRequestRecord> {
  const existing = await getRequestOrThrow(id);

  if (existing.requestedByUserId === actorUserId) {
    throw new Error(
      'VALIDATION:You cannot reject a holiday request you created. Ask another authorised approver.',
    );
  }
  if (existing.status !== 'SUBMITTED') {
    throw new Error('VALIDATION:Only submitted holiday requests can be rejected.');
  }

  const updated = await persistUpdate(id, {
    status: 'REJECTED',
    reviewedByUserId: actorUserId,
    reviewNote: reviewNote?.trim() || null,
    reviewedAt: isoNow(),
  });

  await notifyRequester(
    updated.requestedByUserId,
    'Holiday request rejected',
    `${updated.name} (${updated.holidayDate}) was rejected.`,
    '/collector/holidays',
  );

  return updated;
}

export async function applyHolidayRequest(
  id: string,
  actorUserId: string,
): Promise<HolidayRequestRecord> {
  const existing = await getRequestOrThrow(id);

  if (existing.status === 'APPLIED') {
    return existing;
  }
  if (existing.status !== 'APPROVED') {
    throw new Error('VALIDATION:Only approved holiday requests can be applied.');
  }

  const holiday = await createHoliday({
    name: existing.name,
    holidayDate: existing.holidayDate,
    scope: existing.scope,
    branch: existing.branch,
  });

  // Multi-day ranges: create additional organisation holiday rows for each day after start.
  if (existing.endDate && existing.endDate > existing.holidayDate) {
    const cursor = new Date(`${existing.holidayDate}T00:00:00Z`);
    const end = new Date(`${existing.endDate}T00:00:00Z`);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    while (cursor <= end) {
      const iso = cursor.toISOString().slice(0, 10);
      await createHoliday({
        name: `${existing.name} (${iso})`,
        holidayDate: iso,
        scope: existing.scope,
        branch: existing.branch,
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }

  const updated = await persistUpdate(id, {
    status: 'APPLIED',
    organizationHolidayId: holiday.id,
    appliedAt: isoNow(),
    reviewedByUserId: existing.reviewedByUserId ?? actorUserId,
  });

  await notifyRequester(
    updated.requestedByUserId,
    'Holiday applied',
    `${updated.name} is now on the organisation holiday calendar.`,
    '/collector/holidays',
  );

  return updated;
}

async function getRequestOrThrow(id: string): Promise<HolidayRequestRecord> {
  if (!isDatabaseEnabled()) {
    const found = memoryRequests.find((entry) => entry.id === id);
    if (!found) {
      throw new Error('NOT_FOUND');
    }
    return found;
  }

  const { findHolidayRequestById } = await import(
    '../../repositories/holiday-request.repository.js'
  );
  const found = await findHolidayRequestById(id);
  if (!found) {
    throw new Error('NOT_FOUND');
  }
  return found;
}

async function persistUpdate(
  id: string,
  patch: Partial<HolidayRequestRecord>,
): Promise<HolidayRequestRecord> {
  if (!isDatabaseEnabled()) {
    const index = memoryRequests.findIndex((entry) => entry.id === id);
    if (index < 0) {
      throw new Error('NOT_FOUND');
    }
    memoryRequests[index] = {
      ...memoryRequests[index]!,
      ...patch,
      updatedAt: isoNow(),
    };
    return memoryRequests[index]!;
  }

  const { updateHolidayRequest } = await import(
    '../../repositories/holiday-request.repository.js'
  );
  const updated = await updateHolidayRequest(id, patch);
  if (!updated) {
    throw new Error('NOT_FOUND');
  }
  return updated;
}

/** Test helper — clears in-memory store. */
export function __resetHolidayRequestMemoryForTests(): void {
  memoryRequests.length = 0;
}
