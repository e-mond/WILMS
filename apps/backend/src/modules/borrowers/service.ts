import { env } from '../../config/env.js';
import { appendAuditEntry } from '../../infrastructure/audit/audit-log.js';
import {
  BORROWER_STATUS,
  deleteBorrower,
  getBorrower,
  listBorrowers,
  nextBorrowerId,
  saveBorrower,
  type BorrowerRecord,
} from '../../db/persistence.js';
import { DEMO_USERS } from '../../seed/demo-users.js';
import { processApprovedBorrower } from '../group-formation/service.js';

const AUDIT_ACTION = {
  BORROWER_REGISTERED: 'borrower.registered',
  BORROWER_APPROVED: 'borrower.approved',
  BORROWER_REJECTED: 'borrower.rejected',
  BORROWER_BLACKLISTED: 'borrower.blacklisted',
  BORROWER_REGISTRATION_DELETED: 'borrower.registration-deleted',
} as const;

function officerName(officerId: string): string {
  return DEMO_USERS.find((user) => user.id === officerId)?.displayName ?? officerId;
}

function toSummary(record: BorrowerRecord) {
  return {
    id: record.id,
    fullName: record.fullName,
    phone: record.phone,
    status: record.status,
    groupName: record.groupName,
    groupId: record.groupId,
    photoUrl: record.profile.photoUploadId
      ? `/uploads/${record.profile.photoUploadId}/content`
      : undefined,
  };
}

function toPending(record: BorrowerRecord) {
  return {
    id: record.id,
    fullName: record.fullName,
    phone: record.phone,
    community: record.community,
    registeredAt: record.registeredAt,
    registeredByOfficerName: officerName(record.registeredByOfficerId),
  };
}

function toRegistration(record: BorrowerRecord) {
  return {
    id: record.id,
    fullName: record.fullName,
    phone: record.phone,
    status: record.status,
    registrationStatus: record.status === BORROWER_STATUS.PENDING ? 'PENDING_REVIEW' : record.status,
    community: record.community,
    registeredAt: record.registeredAt,
    canEdit: record.status === BORROWER_STATUS.PENDING,
    canDelete: record.status === BORROWER_STATUS.PENDING,
    photoUrl: record.profile.photoUploadId
      ? `/uploads/${record.profile.photoUploadId}/content`
      : undefined,
  };
}

function toDetail(record: BorrowerRecord) {
  return {
    ...toSummary(record),
    community: record.community,
    registeredAt: record.registeredAt,
    idType: record.idType,
    idNumber: record.idNumber,
  };
}

function toReview(record: BorrowerRecord) {
  return {
    id: record.id,
    fullName: record.fullName,
    phone: record.phone,
    community: record.community,
    registeredAt: record.registeredAt,
    registeredByOfficerName: officerName(record.registeredByOfficerId),
    profile: record.profile,
    status: record.status,
  };
}

function assertPending(record: BorrowerRecord | undefined): BorrowerRecord {
  if (!record) {
    throw new Error('NOT_FOUND');
  }

  if (record.status !== BORROWER_STATUS.PENDING) {
    throw new Error('VALIDATION');
  }

  return record;
}

export async function listBorrowerSummaries() {
  return (await listBorrowers()).map(toSummary);
}

export async function listPendingApplications() {
  return (await listBorrowers())
    .filter((record) => record.status === BORROWER_STATUS.PENDING)
    .map(toPending);
}

export async function listMyRegistrations(officerId: string) {
  return (await listBorrowers())
    .filter((record) => record.registeredByOfficerId === officerId)
    .map(toRegistration);
}

export async function listReviewedApplications(approverId: string) {
  void approverId;
  const reviewedStatuses = new Set<string>([
    BORROWER_STATUS.APPROVED,
    BORROWER_STATUS.REJECTED,
    BORROWER_STATUS.BLACKLISTED,
  ]);

  return (await listBorrowers())
    .filter((record) => reviewedStatuses.has(record.status))
    .map((record) => ({
      id: record.id,
      fullName: record.fullName,
      phone: record.phone,
      community: record.community,
      decision:
        record.status === BORROWER_STATUS.APPROVED
          ? 'APPROVED'
          : record.status === BORROWER_STATUS.REJECTED
            ? 'REJECTED'
            : 'BLACKLISTED',
      reviewedAt: record.registeredAt,
      reason: record.rejectionReason,
    }));
}

export async function getBorrowerDetail(id: string) {
  const record = await getBorrower(id);

  if (!record) {
    throw new Error('NOT_FOUND');
  }

  return toDetail(record);
}

export async function getBorrowerReviewDetail(id: string) {
  const record = await getBorrower(id);

  if (!record) {
    throw new Error('NOT_FOUND');
  }

  return toReview(record);
}

export async function registerBorrower(payload: Record<string, unknown>, actorId: string) {
  const id = nextBorrowerId();
  const record: BorrowerRecord = {
    id,
    fullName: String(payload.fullName ?? ''),
    phone: String(payload.phone ?? ''),
    idType: String(payload.idType ?? 'GHANA_CARD'),
    idNumber: String(payload.idNumber ?? ''),
    status: BORROWER_STATUS.PENDING,
    hasActiveLoan: false,
    groupName: '',
    community: String(payload.city ?? payload.community ?? ''),
    registeredAt: new Date().toISOString(),
    registeredByOfficerId: String(payload.registeredByOfficerId ?? actorId),
    profile: {
      dateOfBirth: String(payload.dateOfBirth ?? ''),
      gender: String(payload.gender ?? 'FEMALE'),
      email: payload.email ? String(payload.email) : undefined,
      nationality: String(payload.nationality ?? 'Ghanaian'),
      houseAddress: String(payload.houseAddress ?? ''),
      gpsAddress: String(payload.gpsAddress ?? ''),
      city: String(payload.city ?? ''),
      region: String(payload.region ?? ''),
      district: String(payload.district ?? ''),
      businessName: String(payload.businessName ?? ''),
      businessAddress: String(payload.businessAddress ?? ''),
      typeOfWork: String(payload.typeOfWork ?? ''),
      guarantorName: String(payload.guarantorName ?? ''),
      guarantorPhone: String(payload.guarantorPhone ?? ''),
      guarantorRelationship: String(payload.guarantorRelationship ?? ''),
      photoFileName: String(payload.photoFileName ?? 'photo.jpg'),
      photoMimeType: String(payload.photoMimeType ?? 'image/jpeg'),
      photoUploadId: payload.photoUploadId ? String(payload.photoUploadId) : undefined,
      guarantorPhotoUploadId: payload.guarantorPhotoUploadId
        ? String(payload.guarantorPhotoUploadId)
        : undefined,
    },
  };

  await saveBorrower(record);
  appendAuditEntry({
    action: AUDIT_ACTION.BORROWER_REGISTERED,
    actorId,
    targetEntityId: id,
    targetEntityType: 'borrower',
  });

  return toSummary(record);
}

export async function approveBorrower(id: string, actorId: string, actorDisplayName?: string) {
  const record = assertPending(await getBorrower(id));
  record.status = BORROWER_STATUS.APPROVED;
  await saveBorrower(record);

  appendAuditEntry({
    action: AUDIT_ACTION.BORROWER_APPROVED,
    actorId,
    actorDisplayName,
    targetEntityId: id,
    targetEntityType: 'borrower',
  });

  await processApprovedBorrower({
    borrowerId: record.id,
    fullName: record.fullName,
    community: record.community,
    approvedAt: new Date().toISOString(),
  });

  return toSummary(record);
}

export async function rejectBorrower(
  id: string,
  reason: string,
  actorId: string,
  actorDisplayName?: string,
) {
  const record = assertPending(await getBorrower(id));
  record.status = BORROWER_STATUS.REJECTED;
  record.rejectionReason = reason.trim();
  await saveBorrower(record);

  appendAuditEntry({
    action: AUDIT_ACTION.BORROWER_REJECTED,
    actorId,
    actorDisplayName,
    targetEntityId: id,
    targetEntityType: 'borrower',
    reason: record.rejectionReason,
  });

  return toSummary(record);
}

export async function blacklistBorrower(
  id: string,
  reason: string,
  actorId: string,
  actorDisplayName?: string,
) {
  const record = assertPending(await getBorrower(id));
  record.status = BORROWER_STATUS.BLACKLISTED;
  record.rejectionReason = reason.trim();
  await saveBorrower(record);

  appendAuditEntry({
    action: AUDIT_ACTION.BORROWER_BLACKLISTED,
    actorId,
    actorDisplayName,
    targetEntityId: id,
    targetEntityType: 'borrower',
    reason: record.rejectionReason,
  });

  return toSummary(record);
}

export async function deleteRegistration(id: string, officerId: string) {
  const record = await getBorrower(id);

  if (!record) {
    throw new Error('NOT_FOUND');
  }

  if (record.registeredByOfficerId !== officerId) {
    throw new Error('UNAUTHORIZED');
  }

  if (record.status !== BORROWER_STATUS.PENDING) {
    throw new Error('VALIDATION');
  }

  await deleteBorrower(id);
  appendAuditEntry({
    action: AUDIT_ACTION.BORROWER_REGISTRATION_DELETED,
    actorId: officerId,
    targetEntityId: id,
    targetEntityType: 'borrower',
  });
}

export async function checkPhone(phone: string) {
  const duplicate = (await listBorrowers()).some((record) => record.phone === phone);
  return { available: !duplicate, duplicate };
}

export async function checkId(idType: string, idNumber: string) {
  const duplicate = (await listBorrowers()).some(
    (record) => record.idType === idType && record.idNumber === idNumber,
  );
  return { available: !duplicate, duplicate };
}

export async function checkName(fullName: string) {
  const matches = (await listBorrowers())
    .filter((record) => record.fullName.toLowerCase().includes(fullName.toLowerCase()))
    .map((record) => ({ id: record.id, fullName: record.fullName }));
  return { matches, hasSimilar: matches.length > 0 };
}

export async function checkActiveLoan(phone: string) {
  const borrower = (await listBorrowers()).find((record) => record.phone === phone);
  return { hasActiveLoan: Boolean(borrower?.hasActiveLoan), borrowerId: borrower?.id };
}

export async function checkBlacklist(input: { phone?: string; idType?: string; idNumber?: string }) {
  const blocked = (await listBorrowers()).some((record) => {
    if (record.status !== BORROWER_STATUS.BLACKLISTED) {
      return false;
    }

    if (input.phone && record.phone === input.phone) {
      return true;
    }

    return Boolean(
      input.idType &&
        input.idNumber &&
        record.idType === input.idType &&
        record.idNumber === input.idNumber,
    );
  });

  return { blocked };
}
