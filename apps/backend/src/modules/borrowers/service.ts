import { env } from '../../config/env.js';
import { normalizeBorrowerId, validateBorrowerId } from '@wilms/shared-validation';
import { appendAuditEntry, listAuditEntries } from '../../infrastructure/audit/audit-log.js';
import { isDatabaseEnabled } from '../../db/client.js';
import {
  BORROWER_STATUS,
  deleteBorrower,
  getBorrower,
  listBorrowers,
  nextBorrowerId,
  saveBorrower,
  type BorrowerRecord,
} from '../../db/persistence.js';
import * as userRepo from '../../repositories/user.repository.js';
import { resolveUploadAccessUrlById } from '../../infrastructure/uploads/index.js';
import { DEMO_USERS } from '../../seed/demo-users.js';
import {
  notifyRegistrationApproved,
  notifyRegistrationBlacklisted,
  notifyRegistrationRejected,
} from '../../infrastructure/notifications/event-dispatch.js';
import * as draftRepo from '../../repositories/registration-draft.repository.js';
import {
  canDeleteRegistrationWorkflow,
  canEditRegistrationWorkflow,
  resolveRegistrationWorkflowStatus,
} from './registration-workflow.js';
import { processApprovedBorrower } from '../group-formation/service.js';
import * as loanService from '../loans/service.js';
import { buildBorrowerRiskSummary } from './borrower-risk.js';
import { formatBorrowerDisplayId } from './display-id.js';

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

async function resolveOfficerDisplayName(officerId: string): Promise<string> {
  if (isDatabaseEnabled()) {
    const user = await userRepo.getUserById(officerId);
    if (user?.displayName?.trim()) {
      return user.displayName.trim();
    }
  }

  return officerName(officerId);
}

function uploadContentUrl(uploadId?: string | null): string | undefined {
  return uploadId ? `/uploads/${uploadId}/content` : undefined;
}

async function resolvePhotoUrl(uploadId?: string | null): Promise<string | undefined> {
  if (!uploadId) {
    return undefined;
  }

  return resolveUploadAccessUrlById(uploadId);
}

function assertValidBorrowerId(idType: string, idNumber: string): string {
  const normalized = normalizeBorrowerId(idType, idNumber);
  const validation = validateBorrowerId(idType, normalized);

  if (!validation.valid) {
    throw new Error(`VALIDATION:${validation.error ?? 'Invalid ID number.'}`);
  }

  return normalized;
}

async function buildBorrowerSequenceMap(): Promise<Map<string, number>> {
  const sorted = [...(await listBorrowers())].sort((left, right) =>
    left.registeredAt.localeCompare(right.registeredAt),
  );

  return new Map(sorted.map((record, index) => [record.id, index + 1]));
}

function toSummary(record: BorrowerRecord, sequence?: number) {
  return {
    id: record.id,
    displayId: formatBorrowerDisplayId(
      { community: record.community, registeredAt: record.registeredAt },
      sequence ?? 1,
    ),
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

function toPending(record: BorrowerRecord, officerDisplayName: string) {
  return {
    id: record.id,
    displayId: formatBorrowerDisplayId(
      { community: record.community, registeredAt: record.registeredAt },
      1,
    ),
    fullName: record.fullName,
    phone: record.phone,
    community: record.community,
    registeredAt: record.registeredAt,
    registeredByOfficerName: officerDisplayName,
  };
}

function toRegistration(record: BorrowerRecord, sequence?: number) {
  const registrationStatus = resolveRegistrationWorkflowStatus(record.status, record.registeredAt);

  return {
    id: record.id,
    displayId: formatBorrowerDisplayId(
      { community: record.community, registeredAt: record.registeredAt },
      sequence ?? 1,
    ),
    fullName: record.fullName,
    phone: record.phone,
    status: record.status,
    registrationStatus,
    community: record.community,
    registeredAt: record.registeredAt,
    canEdit: canEditRegistrationWorkflow(registrationStatus),
    canDelete: canDeleteRegistrationWorkflow(registrationStatus),
    photoUrl: uploadContentUrl(record.profile.photoUploadId),
  };
}

function toDetail(record: BorrowerRecord, sequence?: number) {
  return {
    ...toSummary(record, sequence),
    community: record.community,
    registeredAt: record.registeredAt,
    idType: record.idType,
    idNumber: record.idNumber,
    nationalId: record.idNumber,
    alternativePhone: record.profile.guarantorPhone,
    email: record.profile.email,
    gpsAddress: record.profile.gpsAddress,
    houseAddress: record.profile.houseAddress,
    dateOfBirth: record.profile.dateOfBirth,
    gender: record.profile.gender,
    nationality: record.profile.nationality,
    businessName: record.profile.businessName,
    typeOfWork: record.profile.typeOfWork,
    city: record.profile.city,
    region: record.profile.region,
    district: record.profile.district,
    guarantorName: record.profile.guarantorName,
    guarantorPhone: record.profile.guarantorPhone,
  };
}

async function toReview(record: BorrowerRecord, officerDisplayName: string, sequence?: number) {
  const detail = toDetail(record, sequence);
  const [photoUrl, guarantorPhotoUrl, idDocumentUrl] = await Promise.all([
    resolvePhotoUrl(record.profile.photoUploadId),
    resolvePhotoUrl(record.profile.guarantorPhotoUploadId),
    resolvePhotoUrl(record.profile.idDocumentUploadId),
  ]);

  return {
    ...detail,
    displayId: formatBorrowerDisplayId(
      { community: record.community, registeredAt: record.registeredAt },
      sequence ?? 1,
    ),
    dateOfBirth: record.profile.dateOfBirth ?? '',
    gender: record.profile.gender ?? '',
    email: record.profile.email,
    nationality: record.profile.nationality ?? '',
    idType: record.idType,
    idNumber: record.idNumber,
    houseAddress: record.profile.houseAddress ?? '',
    gpsAddress: record.profile.gpsAddress ?? '',
    city: record.profile.city ?? '',
    region: record.profile.region ?? '',
    district: record.profile.district ?? '',
    businessName: record.profile.businessName ?? '',
    businessAddress: record.profile.businessAddress ?? '',
    typeOfWork: record.profile.typeOfWork ?? '',
    guarantorName: record.profile.guarantorName ?? '',
    guarantorPhone: record.profile.guarantorPhone ?? '',
    guarantorRelationship: record.profile.guarantorRelationship ?? '',
    photoFileName: record.profile.photoFileName ?? '',
    photoMimeType: record.profile.photoMimeType ?? '',
    photoUrl,
    guarantorPhotoUrl,
    idDocumentUrl,
    registeredByOfficerId: record.registeredByOfficerId,
    registeredByOfficerName: officerDisplayName,
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

export async function listBorrowerSummaries(options?: { limit?: number; offset?: number }) {
  const records = await listBorrowers(options);
  const sorted = [...records].sort((left, right) => left.registeredAt.localeCompare(right.registeredAt));
  const sequenceById = new Map(sorted.map((record, index) => [record.id, index + 1]));

  return records.map((record) => toSummary(record, sequenceById.get(record.id)));
}

export async function listPendingApplications() {
  const pendingRecords = (await listBorrowers())
    .filter((record) => record.status === BORROWER_STATUS.PENDING)
    .sort((left, right) => left.registeredAt.localeCompare(right.registeredAt));

  const officerNames = new Map<string, string>();
  await Promise.all(
    [...new Set(pendingRecords.map((record) => record.registeredByOfficerId))].map(
      async (officerId) => {
        officerNames.set(officerId, await resolveOfficerDisplayName(officerId));
      },
    ),
  );

  const sequenceById = new Map(
    pendingRecords.map((record, index) => [record.id, index + 1]),
  );

  return pendingRecords.map((record) => ({
    ...toPending(record, officerNames.get(record.registeredByOfficerId) ?? record.registeredByOfficerId),
    displayId: formatBorrowerDisplayId(
      { community: record.community, registeredAt: record.registeredAt },
      sequenceById.get(record.id) ?? 1,
    ),
  }));
}

export async function listMyRegistrations(officerId: string) {
  const records = (await listBorrowers()).filter(
    (record) => record.registeredByOfficerId === officerId,
  );
  const sorted = [...records].sort((left, right) =>
    left.registeredAt.localeCompare(right.registeredAt),
  );
  const sequenceById = new Map(sorted.map((record, index) => [record.id, index + 1]));

  const submitted = records
    .map((record) => toRegistration(record, sequenceById.get(record.id)))
    .sort(
      (left, right) =>
        new Date(right.registeredAt).getTime() - new Date(left.registeredAt).getTime(),
    );

  if (!isDatabaseEnabled()) {
    return submitted;
  }

  const drafts = await draftRepo.listRegistrationDrafts(officerId);
  const draftRows = drafts.map((draft) => {
    const payload = draft.draftPayload;
    const fullName = typeof payload.fullName === 'string' ? payload.fullName : 'Draft registration';
    const phone = typeof payload.phone === 'string' ? payload.phone : '';
    const community =
      typeof payload.city === 'string' && payload.city
        ? payload.city
        : typeof payload.community === 'string'
          ? payload.community
          : '';

    return {
      id: draft.id,
      displayId: `DRAFT-${draft.id.slice(0, 8).toUpperCase()}`,
      fullName,
      phone,
      status: BORROWER_STATUS.PENDING,
      registrationStatus: resolveRegistrationWorkflowStatus('DRAFT', draft.updatedAt),
      community,
      registeredAt: draft.updatedAt,
      canEdit: true,
      canDelete: true,
      photoUrl: undefined,
      isDraft: true,
    };
  });

  return [...draftRows, ...submitted];
}

export async function listReviewedApplications(approverId: string) {
  void approverId;

  const reviewActions = new Set<string>([
    'BORROWER_APPROVED',
    'BORROWER_REJECTED',
    'BORROWER_BLACKLISTED',
  ]);

  const decisionByAction: Record<string, 'APPROVED' | 'REJECTED' | 'BLACKLISTED'> = {
    BORROWER_APPROVED: 'APPROVED',
    BORROWER_REJECTED: 'REJECTED',
    BORROWER_BLACKLISTED: 'BLACKLISTED',
  };

  const borrowers = await listBorrowers();
  const borrowerById = new Map(borrowers.map((record) => [record.id, record]));
  const entries = await listAuditEntries({ limit: 500 });

  return entries
    .filter((entry) => reviewActions.has(entry.action))
    .map((entry) => {
      const borrower = borrowerById.get(entry.targetEntityId);

      return {
        borrowerId: entry.targetEntityId,
        borrowerName: borrower?.fullName ?? entry.targetEntityDisplayId ?? 'Unknown borrower',
        community: borrower?.community ?? '—',
        decision: decisionByAction[entry.action] ?? 'REJECTED',
        reason: entry.reason,
        reviewedAt: entry.createdAt,
        reviewedBy: entry.actorDisplayName ?? entry.actorDisplayId ?? 'Approver',
        status: borrower?.status,
      };
    });
}

export async function getBorrowerDetail(id: string) {
  const record = await getBorrower(id);

  if (!record) {
    throw new Error('NOT_FOUND');
  }

  const sequenceById = await buildBorrowerSequenceMap();
  return toDetail(record, sequenceById.get(record.id));
}

export async function getBorrowerFullProfile(id: string) {
  const record = await getBorrower(id);

  if (!record) {
    throw new Error('NOT_FOUND');
  }

  const detail = toDetail(record);
  let loans: Awaited<ReturnType<typeof loanService.listBorrowerLoans>> = [];
  let progress: Awaited<ReturnType<typeof loanService.getLoanProgress>> | null = null;

  if (isDatabaseEnabled()) {
    loans = await loanService.listBorrowerLoans(id);
    const activeLoan =
      loans.find((loan) => loan.status === 'ACTIVE') ?? loans[0];

    if (activeLoan) {
      try {
        progress = await loanService.getLoanProgress(activeLoan.id);
      } catch {
        progress = null;
      }
    }
  }

  return {
    ...detail,
    loans,
    progress,
    risk: buildBorrowerRiskSummary(record, loans, progress),
  };
}

export async function getBorrowerReviewDetail(id: string) {
  const record = await getBorrower(id);

  if (!record) {
    throw new Error('NOT_FOUND');
  }

  const pendingRecords = (await listBorrowers())
    .filter((entry) => entry.status === BORROWER_STATUS.PENDING)
    .sort((left, right) => left.registeredAt.localeCompare(right.registeredAt));
  const sequenceById = new Map(
    pendingRecords.map((entry, index) => [entry.id, index + 1]),
  );

  const officerDisplayName = await resolveOfficerDisplayName(record.registeredByOfficerId);

  return await toReview(record, officerDisplayName, sequenceById.get(record.id));
}

export async function registerBorrower(payload: Record<string, unknown>, actorId: string) {
  const idType = String(payload.idType ?? 'GHANA_CARD');
  const idNumber = assertValidBorrowerId(idType, String(payload.idNumber ?? ''));

  if (payload.guarantorIdType && payload.guarantorIdNumber) {
    assertValidBorrowerId(String(payload.guarantorIdType), String(payload.guarantorIdNumber));
  }

  const id = nextBorrowerId();
  const record: BorrowerRecord = {
    id,
    fullName: String(payload.fullName ?? ''),
    phone: String(payload.phone ?? ''),
    idType,
    idNumber,
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

  if (record.phone?.trim()) {
    void notifyRegistrationApproved({
      borrowerId: record.id,
      borrowerName: record.fullName,
      borrowerPhone: record.phone,
      borrowerEmail: record.profile.email,
    });
  }

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

  void notifyRegistrationRejected({
    borrowerId: record.id,
    borrowerName: record.fullName,
    borrowerPhone: record.phone,
    borrowerEmail: record.profile.email,
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

  void notifyRegistrationBlacklisted({
    borrowerId: record.id,
    borrowerName: record.fullName,
    borrowerPhone: record.phone,
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
  const normalized = normalizeBorrowerId(idType, idNumber);
  const duplicate = (await listBorrowers()).some(
    (record) => record.idType === idType && record.idNumber === normalized,
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

export async function checkGuarantorEligibility(input: {
  guarantorPhone: string;
  guarantorIdNumber?: string;
  guarantorName: string;
  borrowerPhone?: string;
  isGroupLeader?: boolean;
  isApprovedCommunityLeader?: boolean;
}) {
  const { evaluateGuarantorEligibility } = await import('./guarantor-eligibility.js');
  return evaluateGuarantorEligibility(input, await listBorrowers());
}

export async function listRegistrationDraftsForOfficer(officerId: string) {
  if (!isDatabaseEnabled()) {
    return [];
  }

  const { listRegistrationDrafts } = await import(
    '../../repositories/registration-draft.repository.js'
  );
  return listRegistrationDrafts(officerId);
}

export async function getRegistrationDraft(id: string, officerId: string) {
  if (!isDatabaseEnabled()) {
    throw new Error('NOT_FOUND');
  }

  const { getRegistrationDraft } = await import(
    '../../repositories/registration-draft.repository.js'
  );
  const draft = await getRegistrationDraft(id, officerId);

  if (!draft) {
    throw new Error('NOT_FOUND');
  }

  return draft;
}

export async function createRegistrationDraft(
  officerId: string,
  draftPayload: Record<string, unknown> = {},
) {
  if (!isDatabaseEnabled()) {
    throw new Error('VALIDATION:Database is required for registration drafts.');
  }

  const { createRegistrationDraft } = await import(
    '../../repositories/registration-draft.repository.js'
  );
  return createRegistrationDraft(officerId, draftPayload);
}

export async function updateRegistrationDraft(
  id: string,
  officerId: string,
  draftPayload: Record<string, unknown>,
  lastCompletedStep: number,
) {
  if (!isDatabaseEnabled()) {
    throw new Error('NOT_FOUND');
  }

  const { updateRegistrationDraft } = await import(
    '../../repositories/registration-draft.repository.js'
  );
  const draft = await updateRegistrationDraft(id, officerId, draftPayload, lastCompletedStep);

  if (!draft) {
    throw new Error('NOT_FOUND');
  }

  return draft;
}

export async function deleteRegistrationDraft(id: string, officerId: string) {
  if (!isDatabaseEnabled()) {
    throw new Error('NOT_FOUND');
  }

  const { deleteRegistrationDraft } = await import(
    '../../repositories/registration-draft.repository.js'
  );
  const deleted = await deleteRegistrationDraft(id, officerId);

  if (!deleted) {
    throw new Error('NOT_FOUND');
  }
}

export async function submitRegistrationDraft(id: string, officerId: string) {
  const draft = await getRegistrationDraft(id, officerId);
  const payload = {
    ...draft.draftPayload,
    registeredByOfficerId: officerId,
  };
  const result = await registerBorrower(payload, officerId);
  await deleteRegistrationDraft(id, officerId);
  return result;
}
