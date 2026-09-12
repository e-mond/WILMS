import type { BorrowerRecord } from '../../db/persistence.js';
import { BORROWER_STATUS, listBorrowers } from '../../db/persistence.js';
import { formatBorrowerDisplayId } from '@wilms/shared-utils';
import { normalizeGhanaPhone } from '../../infrastructure/sms/normalize-phone.js';
import { resolveUploadAccessUrlById } from '../../infrastructure/uploads/index.js';
import {
  evaluateGuarantorEligibility,
  type GuarantorEligibilityResult,
} from './guarantor-eligibility.js';
import { getGuarantorLimits } from '../settings/guarantor-limits.js';

const SEARCH_MIN_CHARS = 2;
const SEARCH_RESULT_LIMIT = 8;

export interface GuarantorSearchHit {
  kind: 'borrower' | 'guarantor';
  /** Stable key for React lists — phone when available, else borrower id. */
  key: string;
  name: string;
  phone: string;
  phoneDisplay: string;
  displayId?: string;
  community?: string;
  groupName?: string;
  activeGuaranteeCount: number;
  maxGuarantees: number;
  isEligiblePreview: boolean;
  isGroupLeader?: boolean;
  isBlacklisted?: boolean;
}

export interface GuarantorLookupResult {
  name: string;
  phone: string;
  phoneDisplay: string;
  displayId?: string;
  community?: string;
  groupName?: string;
  idType?: string;
  idNumber?: string;
  photoUploadId?: string;
  photoUrl?: string | null;
  borrowerId?: string;
  isGroupLeader: boolean;
  isBlacklisted: boolean;
  eligibility: GuarantorEligibilityResult;
  guaranteedBorrowers: Array<{
    displayId: string;
    fullName: string;
    community: string;
    status: string;
  }>;
}

function maskGhanaPhone(phone: string): string {
  const normalized = normalizeGhanaPhone(phone).replace(/\D/g, '');
  const local = normalized.startsWith('233') ? `0${normalized.slice(3)}` : normalized;
  if (local.length < 10) {
    return 'XXX XXX XXXX';
  }
  return `${local.slice(0, 3)} XXX ${local.slice(-4)}`;
}

function matchesQuery(value: string | undefined, query: string): boolean {
  if (!value) return false;
  const normalisedValue = value.toLowerCase();
  const normalisedQuery = query.toLowerCase();
  if (normalisedValue.includes(normalisedQuery)) return true;
  const digits = query.replace(/\D/g, '');
  if (digits.length >= 3 && value.replace(/\D/g, '').includes(digits)) return true;
  return false;
}

function rankScore(name: string, phone: string, query: string): number {
  const q = query.trim().toLowerCase();
  const n = name.trim().toLowerCase();
  let score = 0;
  if (n === q) score += 100;
  else if (n.startsWith(q)) score += 60;
  else if (n.includes(q)) score += 30;

  const digits = query.replace(/\D/g, '');
  if (digits.length >= 3 && phone.replace(/\D/g, '').includes(digits)) {
    score += 40;
  }
  return score;
}

function buildDisplayId(record: BorrowerRecord, sequence: number): string {
  return formatBorrowerDisplayId(
    { community: record.community, registeredAt: record.registeredAt },
    sequence,
  );
}

function isBlacklistedBorrower(record: BorrowerRecord): boolean {
  return record.status === BORROWER_STATUS.BLACKLISTED;
}

interface StoredGuarantorLink {
  record: BorrowerRecord;
  name: string;
  phone: string;
  idType?: string;
  idNumber?: string;
  photoUploadId?: string;
}

function trimmed(value: string | undefined | null): string | undefined {
  const next = value?.trim();
  return next ? next : undefined;
}

function storedGuarantorLinks(
  borrowers: BorrowerRecord[],
  normalizedPhone: string,
): StoredGuarantorLink[] {
  return borrowers.flatMap((record) => {
    const phone = trimmed(record.profile?.guarantorPhone);
    if (!phone || normalizeGhanaPhone(phone) !== normalizedPhone) {
      return [];
    }

    const name = trimmed(record.profile?.guarantorName);
    if (!name) {
      return [];
    }

    return [
      {
        record,
        name,
        phone,
        idType: trimmed(record.profile?.guarantorIdType),
        idNumber: trimmed(record.profile?.guarantorIdNumber),
        photoUploadId: trimmed(record.profile?.guarantorPhotoUploadId),
      },
    ];
  });
}

/**
 * Prefer one complete historical guarantor record for the same phone.
 * ID type and number always come from the same record. A photo may fill a gap
 * from another record of that same person, but never overrides a complete ID.
 */
function pickStoredGuarantorIdentity(links: StoredGuarantorLink[]): {
  name: string;
  phone: string;
  idType?: string;
  idNumber?: string;
  photoUploadId?: string;
} | undefined {
  if (links.length === 0) {
    return undefined;
  }

  const ranked = [...links].sort((left, right) => {
    const leftComplete = Boolean(left.idType && left.idNumber);
    const rightComplete = Boolean(right.idType && right.idNumber);
    if (leftComplete !== rightComplete) {
      return leftComplete ? -1 : 1;
    }

    const leftPhoto = Boolean(left.photoUploadId);
    const rightPhoto = Boolean(right.photoUploadId);
    if (leftComplete && leftPhoto !== rightPhoto) {
      return leftPhoto ? -1 : 1;
    }

    return right.record.registeredAt.localeCompare(left.record.registeredAt);
  });

  const identity = ranked[0]!;
  const photoUploadId =
    identity.photoUploadId ??
    [...links]
      .filter((link) => link.photoUploadId)
      .sort((left, right) => right.record.registeredAt.localeCompare(left.record.registeredAt))[0]
      ?.photoUploadId;

  return {
    name: identity.name,
    phone: identity.phone,
    idType: identity.idType && identity.idNumber ? identity.idType : undefined,
    idNumber: identity.idType && identity.idNumber ? identity.idNumber : undefined,
    photoUploadId,
  };
}

export async function searchGuarantors(
  query: string,
  context?: { borrowerPhone?: string; borrowerIdNumber?: string },
): Promise<GuarantorSearchHit[]> {
  const q = query.trim();
  if (q.length < SEARCH_MIN_CHARS) {
    return [];
  }

  const [borrowers, limits] = await Promise.all([listBorrowers(), getGuarantorLimits()]);
  const sequenceById = new Map(borrowers.map((record, index) => [record.id, index + 1]));
  const hits: Array<GuarantorSearchHit & { score: number }> = [];
  const seenPhones = new Set<string>();

  for (const borrower of borrowers) {
    if (
      !matchesQuery(borrower.fullName, q) &&
      !matchesQuery(borrower.phone, q) &&
      !matchesQuery(borrower.idNumber, q) &&
      !matchesQuery(buildDisplayId(borrower, sequenceById.get(borrower.id) ?? 1), q)
    ) {
      continue;
    }

    const phone = borrower.phone?.trim();
    if (!phone) continue;
    const phoneKey = normalizeGhanaPhone(phone);
    if (seenPhones.has(phoneKey)) continue;
    seenPhones.add(phoneKey);

    const eligibility = evaluateGuarantorEligibility(
      {
        guarantorPhone: phone,
        guarantorName: borrower.fullName,
        borrowerPhone: context?.borrowerPhone,
        borrowerIdNumber: context?.borrowerIdNumber,
      },
      borrowers,
      {
        maxGuarantees: limits.maxGuarantorGuarantees,
        maxLeaderGuarantees: limits.maxLeaderGuarantorGuarantees,
      },
    );

    const blacklisted = isBlacklistedBorrower(borrower);
    hits.push({
      kind: 'borrower',
      key: `borrower:${phoneKey}`,
      name: borrower.fullName,
      phone,
      phoneDisplay: maskGhanaPhone(phone),
      displayId: buildDisplayId(borrower, sequenceById.get(borrower.id) ?? 1),
      community: borrower.community,
      groupName: borrower.groupName || undefined,
      activeGuaranteeCount: eligibility.activeGuaranteeCount,
      maxGuarantees: eligibility.maxGuarantees,
      isEligiblePreview: eligibility.isEligible && !blacklisted,
      isBlacklisted: blacklisted,
      score: rankScore(borrower.fullName, phone, q) + (blacklisted ? -50 : 10),
    });
  }

  for (const borrower of borrowers) {
    const guarantorName = borrower.profile?.guarantorName?.trim();
    const guarantorPhone = borrower.profile?.guarantorPhone?.trim();
    if (!guarantorName || !guarantorPhone) continue;
    if (!matchesQuery(guarantorName, q) && !matchesQuery(guarantorPhone, q)) continue;

    const phoneKey = normalizeGhanaPhone(guarantorPhone);
    if (seenPhones.has(phoneKey)) continue;
    seenPhones.add(phoneKey);

    const asBorrower = borrowers.find(
      (entry) => normalizeGhanaPhone(entry.phone) === phoneKey,
    );

    const eligibility = evaluateGuarantorEligibility(
      {
        guarantorPhone,
        guarantorName,
        borrowerPhone: context?.borrowerPhone,
        borrowerIdNumber: context?.borrowerIdNumber,
      },
      borrowers,
      {
        maxGuarantees: limits.maxGuarantorGuarantees,
        maxLeaderGuarantees: limits.maxLeaderGuarantorGuarantees,
      },
    );

    const blacklisted = asBorrower ? isBlacklistedBorrower(asBorrower) : false;
    hits.push({
      kind: asBorrower ? 'borrower' : 'guarantor',
      key: `guarantor:${phoneKey}`,
      name: asBorrower?.fullName ?? guarantorName,
      phone: guarantorPhone,
      phoneDisplay: maskGhanaPhone(guarantorPhone),
      displayId: asBorrower
        ? buildDisplayId(asBorrower, sequenceById.get(asBorrower.id) ?? 1)
        : undefined,
      community: asBorrower?.community ?? borrower.community,
      groupName: asBorrower?.groupName || borrower.groupName || undefined,
      activeGuaranteeCount: eligibility.activeGuaranteeCount,
      maxGuarantees: eligibility.maxGuarantees,
      isEligiblePreview: eligibility.isEligible && !blacklisted,
      isBlacklisted: blacklisted,
      score: rankScore(asBorrower?.fullName ?? guarantorName, guarantorPhone, q),
    });
  }

  return hits
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name))
    .slice(0, SEARCH_RESULT_LIMIT)
    .map(({ score: _score, ...hit }) => hit);
}

export async function lookupGuarantorForRegistration(input: {
  phone: string;
  borrowerPhone?: string;
  borrowerIdNumber?: string;
  excludeBorrowerId?: string;
}): Promise<GuarantorLookupResult> {
  const phone = input.phone.trim();
  if (!phone) {
    throw new Error('VALIDATION:Guarantor phone is required.');
  }

  const normalizedPhone = normalizeGhanaPhone(phone);
  const [borrowers, limits] = await Promise.all([listBorrowers(), getGuarantorLimits()]);
  const sequenceById = new Map(borrowers.map((record, index) => [record.id, index + 1]));

  const asBorrower = borrowers.find(
    (entry) => normalizeGhanaPhone(entry.phone) === normalizedPhone,
  );
  const storedGuarantor = pickStoredGuarantorIdentity(
    storedGuarantorLinks(borrowers, normalizedPhone),
  );

  if (!asBorrower && !storedGuarantor) {
    throw new Error('NOT_FOUND');
  }

  const name = asBorrower?.fullName?.trim() || storedGuarantor?.name || 'Guarantor';

  const baseEligibility = evaluateGuarantorEligibility(
    {
      guarantorPhone: normalizedPhone,
      guarantorName: name,
      borrowerPhone: input.borrowerPhone,
      borrowerIdNumber: input.borrowerIdNumber,
      excludeBorrowerId: input.excludeBorrowerId,
    },
    borrowers,
    {
      maxGuarantees: limits.maxGuarantorGuarantees,
      maxLeaderGuarantees: limits.maxLeaderGuarantorGuarantees,
    },
  );

  const blacklisted = asBorrower ? isBlacklistedBorrower(asBorrower) : false;
  const eligibility = blacklisted
    ? {
        ...baseEligibility,
        isEligible: false,
        validationStatus: 'INVALID' as const,
        message: 'This person is blacklisted and cannot act as a guarantor.',
      }
    : baseEligibility;

  const photoUploadId = trimmed(asBorrower?.profile?.photoUploadId) ?? storedGuarantor?.photoUploadId;
  const photoUrl = photoUploadId ? await resolveUploadAccessUrlById(photoUploadId) : null;
  const idType = trimmed(asBorrower?.idType) ?? storedGuarantor?.idType;
  const idNumber = trimmed(asBorrower?.idNumber) ?? storedGuarantor?.idNumber;

  const guaranteed = borrowers.filter(
    (entry) =>
      entry.profile?.guarantorPhone &&
      normalizeGhanaPhone(entry.profile.guarantorPhone) === normalizedPhone &&
      entry.status !== BORROWER_STATUS.REJECTED &&
      entry.status !== BORROWER_STATUS.BLACKLISTED,
  );

  return {
    name,
    phone: asBorrower?.phone ?? storedGuarantor?.phone ?? phone,
    phoneDisplay: maskGhanaPhone(normalizedPhone),
    displayId: asBorrower
      ? buildDisplayId(asBorrower, sequenceById.get(asBorrower.id) ?? 1)
      : undefined,
    community: asBorrower?.community,
    groupName: asBorrower?.groupName || undefined,
    idType,
    idNumber,
    photoUploadId,
    photoUrl,
    borrowerId: asBorrower?.id,
    isGroupLeader: false,
    isBlacklisted: blacklisted,
    eligibility,
    guaranteedBorrowers: guaranteed.map((entry) => ({
      displayId: buildDisplayId(entry, sequenceById.get(entry.id) ?? 1),
      fullName: entry.fullName,
      community: entry.community,
      status: entry.status,
    })),
  };
}

export { SEARCH_MIN_CHARS, SEARCH_RESULT_LIMIT, maskGhanaPhone };
