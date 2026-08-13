import { uuidv7 } from 'uuidv7';
import { isDatabaseEnabled } from '../../db/client.js';
import { getBorrower, saveBorrower } from '../../db/persistence.js';
import { appendAuditEntry } from '../../infrastructure/audit/audit-log.js';
import { createInAppNotification } from '../../infrastructure/notifications/in-app-notify.js';
import {
  notifyBorrowerUpdateApproved,
  notifyBorrowerUpdateRejected,
} from '../../infrastructure/notifications/event-dispatch.js';
import * as userRepo from '../../repositories/user.repository.js';
import {
  BORROWER_UPDATE_FIELDS,
  BORROWER_UPDATE_STATUS,
  type BorrowerUpdateField,
  type BorrowerUpdateRequestRecord,
  type BorrowerUpdateStatus,
} from '../../repositories/borrower-update-request.repository.js';

const memoryRequests: BorrowerUpdateRequestRecord[] = [];

function isoNow(): string {
  return new Date().toISOString();
}

function isAllowedField(value: string): value is BorrowerUpdateField {
  return (BORROWER_UPDATE_FIELDS as readonly string[]).includes(value);
}

function readFieldValue(
  record: NonNullable<Awaited<ReturnType<typeof getBorrower>>>,
  field: BorrowerUpdateField,
): string {
  switch (field) {
    case 'PHONE':
      return record.phone;
    case 'ALTERNATE_PHONE':
      return record.profile.alternativePhone ?? '';
    case 'NAME':
      return record.fullName;
    case 'ADDRESS':
      return record.profile.houseAddress;
    case 'COMMUNITY':
      return record.community;
    case 'CITY':
      return record.profile.city;
    case 'BUSINESS_ADDRESS':
      return record.profile.businessAddress;
    case 'GUARANTOR_PHONE':
      return record.profile.guarantorPhone;
    case 'GUARANTOR_NAME':
      return record.profile.guarantorName;
    default:
      return '';
  }
}

function applyFieldValue(
  record: NonNullable<Awaited<ReturnType<typeof getBorrower>>>,
  field: BorrowerUpdateField,
  value: string,
): NonNullable<Awaited<ReturnType<typeof getBorrower>>> {
  const next = {
    ...record,
    profile: { ...record.profile },
  };

  switch (field) {
    case 'PHONE':
      next.phone = value;
      break;
    case 'ALTERNATE_PHONE':
      next.profile = { ...next.profile, alternativePhone: value };
      break;
    case 'NAME':
      next.fullName = value;
      break;
    case 'ADDRESS':
      next.profile.houseAddress = value;
      break;
    case 'COMMUNITY':
      next.community = value;
      break;
    case 'CITY':
      next.profile.city = value;
      break;
    case 'BUSINESS_ADDRESS':
      next.profile.businessAddress = value;
      break;
    case 'GUARANTOR_PHONE':
      next.profile.guarantorPhone = value;
      break;
    case 'GUARANTOR_NAME':
      next.profile.guarantorName = value;
      break;
    default:
      break;
  }

  return next;
}

async function notifyReviewers(title: string, body: string, href: string): Promise<void> {
  try {
    if (!isDatabaseEnabled()) {
      return;
    }
    const users = await userRepo.listUsers();
    const recipients = users.filter(
      (user) =>
        (user.role === 'SUPER_ADMIN' || user.role === 'REGISTRATION_OFFICER') &&
        user.status === 'ACTIVE',
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
      }),
    );
  } catch {
    // Reviewer notification must not block the request.
  }
}

async function persist(record: BorrowerUpdateRequestRecord): Promise<BorrowerUpdateRequestRecord> {
  if (!isDatabaseEnabled()) {
    const index = memoryRequests.findIndex((entry) => entry.id === record.id);
    if (index >= 0) {
      memoryRequests[index] = record;
    } else {
      memoryRequests.unshift(record);
    }
    return record;
  }

  const repo = await import('../../repositories/borrower-update-request.repository.js');
  const existing = await repo.getBorrowerUpdateRequest(record.id);
  if (existing) {
    const updated = await repo.updateBorrowerUpdateRequest(record.id, {
      status: record.status,
      reviewedByUserId: record.reviewedByUserId,
      reviewNote: record.reviewNote,
      reviewedAt: record.reviewedAt,
      appliedAt: record.appliedAt,
    });
    return updated ?? record;
  }
  return repo.insertBorrowerUpdateRequest(record);
}

export async function listBorrowerUpdateRequests(input: {
  actorUserId: string;
  scope: 'own' | 'all';
  statuses?: BorrowerUpdateStatus[];
}): Promise<BorrowerUpdateRequestRecord[]> {
  if (!isDatabaseEnabled()) {
    return memoryRequests
      .filter((entry) => {
        if (input.scope === 'own' && entry.requestedByUserId !== input.actorUserId) {
          return false;
        }
        if (input.statuses?.length && !input.statuses.includes(entry.status)) {
          return false;
        }
        return true;
      })
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  const repo = await import('../../repositories/borrower-update-request.repository.js');
  return repo.listBorrowerUpdateRequests({
    requestedByUserId: input.scope === 'own' ? input.actorUserId : undefined,
    statuses: input.statuses,
  });
}

export async function createBorrowerUpdateRequest(input: {
  borrowerId: string;
  field: string;
  afterValue: string;
  reason: string;
  requestedByUserId: string;
}): Promise<BorrowerUpdateRequestRecord> {
  if (!isAllowedField(input.field)) {
    throw new Error('VALIDATION:Unsupported borrower field.');
  }

  const afterValue = input.afterValue.trim();
  const reason = input.reason.trim();
  if (!afterValue) {
    throw new Error('VALIDATION:A proposed value is required.');
  }
  if (reason.length < 3) {
    throw new Error('VALIDATION:A reason is required.');
  }

  const borrower = await getBorrower(input.borrowerId);
  if (!borrower) {
    throw new Error('NOT_FOUND');
  }

  const now = isoNow();
  const record: BorrowerUpdateRequestRecord = {
    id: uuidv7(),
    borrowerId: borrower.id,
    field: input.field,
    beforeValue: readFieldValue(borrower, input.field),
    afterValue,
    reason,
    status: BORROWER_UPDATE_STATUS.SUBMITTED,
    requestedByUserId: input.requestedByUserId,
    reviewedByUserId: null,
    reviewNote: null,
    reviewedAt: null,
    appliedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  await persist(record);
  appendAuditEntry({
    action: 'borrower.update-requested',
    actorId: input.requestedByUserId,
    targetEntityId: borrower.id,
    targetEntityType: 'borrower',
    reason: `${input.field}: ${record.beforeValue} → ${afterValue}`,
  });

  void notifyReviewers(
    'Borrower update request',
    `${borrower.fullName}: ${input.field} change awaiting review.`,
    '/officer/borrower-updates',
  );

  return record;
}

export async function approveBorrowerUpdateRequest(
  id: string,
  reviewerUserId: string,
  reviewNote?: string | null,
): Promise<BorrowerUpdateRequestRecord> {
  const current = await findRequest(id);
  if (current.requestedByUserId === reviewerUserId) {
    throw new Error('FORBIDDEN:You cannot approve a request you created.');
  }
  if (current.status !== BORROWER_UPDATE_STATUS.SUBMITTED) {
    throw new Error('VALIDATION:Only submitted requests can be approved.');
  }

  const borrower = await getBorrower(current.borrowerId);
  if (!borrower) {
    throw new Error('NOT_FOUND');
  }

  const updatedBorrower = applyFieldValue(borrower, current.field, current.afterValue);
  await saveBorrower(updatedBorrower);

  const now = isoNow();
  const next: BorrowerUpdateRequestRecord = {
    ...current,
    status: BORROWER_UPDATE_STATUS.APPROVED,
    reviewedByUserId: reviewerUserId,
    reviewNote: reviewNote?.trim() || null,
    reviewedAt: now,
    appliedAt: now,
    updatedAt: now,
  };
  await persist(next);

  appendAuditEntry({
    action: 'borrower.update-approved',
    actorId: reviewerUserId,
    targetEntityId: borrower.id,
    targetEntityType: 'borrower',
    reason: `${current.field}: ${current.beforeValue} → ${current.afterValue}`,
  });

  void notifyBorrowerUpdateApproved({
    borrowerId: borrower.id,
    borrowerName: updatedBorrower.fullName,
    borrowerPhone: updatedBorrower.phone,
    borrowerEmail: updatedBorrower.profile.email,
    field: current.field,
    afterValue: current.afterValue,
  });

  void createInAppNotification({
    userId: current.requestedByUserId,
    event: 'COMMUNICATION',
    title: 'Borrower update approved',
    body: `${current.field} change for ${updatedBorrower.fullName} was approved.`,
    href: '/collector/borrower-updates',
  });

  return next;
}

export async function rejectBorrowerUpdateRequest(
  id: string,
  reviewerUserId: string,
  reviewNote?: string | null,
): Promise<BorrowerUpdateRequestRecord> {
  const current = await findRequest(id);
  if (current.requestedByUserId === reviewerUserId) {
    throw new Error('FORBIDDEN:You cannot reject a request you created.');
  }
  if (current.status !== BORROWER_UPDATE_STATUS.SUBMITTED) {
    throw new Error('VALIDATION:Only submitted requests can be rejected.');
  }

  const now = isoNow();
  const next: BorrowerUpdateRequestRecord = {
    ...current,
    status: BORROWER_UPDATE_STATUS.REJECTED,
    reviewedByUserId: reviewerUserId,
    reviewNote: reviewNote?.trim() || null,
    reviewedAt: now,
    updatedAt: now,
  };
  await persist(next);

  const borrower = await getBorrower(current.borrowerId);
  appendAuditEntry({
    action: 'borrower.update-rejected',
    actorId: reviewerUserId,
    targetEntityId: current.borrowerId,
    targetEntityType: 'borrower',
    reason: reviewNote?.trim() || `${current.field} rejected`,
  });

  if (borrower) {
    void notifyBorrowerUpdateRejected({
      borrowerId: borrower.id,
      borrowerName: borrower.fullName,
      borrowerPhone: borrower.phone,
      borrowerEmail: borrower.profile.email,
      field: current.field,
      reviewNote: next.reviewNote,
    });
  }

  void createInAppNotification({
    userId: current.requestedByUserId,
    event: 'COMMUNICATION',
    title: 'Borrower update rejected',
    body: `${current.field} change was rejected.`,
    href: '/collector/borrower-updates',
  });

  return next;
}

async function findRequest(id: string): Promise<BorrowerUpdateRequestRecord> {
  if (!isDatabaseEnabled()) {
    const match = memoryRequests.find((entry) => entry.id === id);
    if (!match) {
      throw new Error('NOT_FOUND');
    }
    return match;
  }

  const repo = await import('../../repositories/borrower-update-request.repository.js');
  const match = await repo.getBorrowerUpdateRequest(id);
  if (!match) {
    throw new Error('NOT_FOUND');
  }
  return match;
}

export function __resetBorrowerUpdateRequestMemoryForTests(): void {
  memoryRequests.length = 0;
}
