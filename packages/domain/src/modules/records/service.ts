import { listAuditEntries } from '../../infrastructure/audit/audit-log.js';
import { listMessageDeliveries } from '../../infrastructure/notifications/delivery-log.js';
import { listBorrowers } from '../../db/persistence.js';
import { normalizeGhanaPhone } from '../../infrastructure/sms/normalize-phone.js';
import {
  evaluateGuarantorEligibility,
  ACTIVE_GUARANTEE_STATUSES,
} from '../borrowers/guarantor-eligibility.js';
import * as borrowerService from '../borrowers/service.js';
import * as loanService from '../loans/service.js';
import type { BorrowerRecord } from '../../db/persistence.js';

export interface RecordSearchHit {
  kind: 'borrower' | 'guarantor' | 'group_leader';
  id: string;
  label: string;
  subtitle: string;
  href: string;
  photoUrl?: string | null;
  activeGuaranteeCount?: number;
  maxGuarantees?: number;
}

export interface GuarantorRecordFile {
  guarantorPhone: string;
  guarantorName: string;
  guarantorPhotoUrl?: string | null;
  guarantorRelationship?: string;
  activeGuaranteeCount: number;
  maxGuarantees: number;
  isAlsoBorrower: boolean;
  borrowerProfileId?: string;
  borrowerProfileName?: string;
  guaranteedBorrowers: Array<{
    borrowerId: string;
    borrowerName: string;
    phone: string;
    community: string;
    status: string;
    href: string;
  }>;
}

function matches(value: string | undefined, query: string): boolean {
  if (!value) return false;
  const normalisedValue = value.toLowerCase();
  const normalisedQuery = query.toLowerCase();
  if (normalisedValue.includes(normalisedQuery)) return true;
  const digits = query.replace(/\D/g, '');
  if (digits.length >= 3 && value.replace(/\D/g, '').includes(digits)) return true;
  return false;
}

function hrefFor(role: string, id: string) {
  if (role === 'APPROVER') return `/approver/records/${id}`;
  if (role === 'REGISTRATION_OFFICER') return `/officer/records/${id}`;
  if (role === 'AUDITOR') return `/auditor/records/${id}`;
  return `/records/${id}`;
}

function guarantorHrefFor(role: string, phone: string) {
  const encoded = encodeURIComponent(normalizeGhanaPhone(phone));
  if (role === 'APPROVER') return `/approver/records/guarantor/${encoded}`;
  if (role === 'REGISTRATION_OFFICER') return `/officer/records/guarantor/${encoded}`;
  if (role === 'AUDITOR') return `/auditor/records/guarantor/${encoded}`;
  return `/records/guarantor/${encoded}`;
}

function isSameGuarantorPhone(record: BorrowerRecord, normalizedQueryPhone: string): boolean {
  const guarantorPhone = record.profile?.guarantorPhone;
  if (!guarantorPhone?.trim()) return false;
  return normalizeGhanaPhone(guarantorPhone) === normalizedQueryPhone;
}

function buildGuarantorHits(
  borrowers: BorrowerRecord[],
  role: string,
): Map<string, RecordSearchHit> {
  const byPhone = new Map<string, RecordSearchHit>();

  for (const borrower of borrowers) {
    const phone = borrower.profile?.guarantorPhone?.trim();
    const name = borrower.profile?.guarantorName?.trim();
    if (!phone && !name) continue;

    const normalizedPhone = phone ? normalizeGhanaPhone(phone) : `name:${name?.toLowerCase() ?? ''}`;
    if (byPhone.has(normalizedPhone)) continue;

    const eligibility = phone
      ? evaluateGuarantorEligibility(
          {
            guarantorPhone: phone,
            guarantorName: name ?? 'Guarantor',
            borrowerPhone: '0240000999',
          },
          borrowers,
        )
      : null;

    const guaranteedCount = phone
      ? borrowers.filter(
          (entry) =>
            ACTIVE_GUARANTEE_STATUSES.has(entry.status) &&
            isSameGuarantorPhone(entry, normalizeGhanaPhone(phone)),
        ).length
      : 0;

    byPhone.set(normalizedPhone, {
      kind: 'guarantor',
      id: normalizedPhone,
      label: name || 'Guarantor',
      subtitle: phone
        ? `${phone} · ${guaranteedCount} active guarantee${guaranteedCount === 1 ? '' : 's'}`
        : 'No phone on file',
      href: phone ? guarantorHrefFor(role, phone) : hrefFor(role, borrower.id),
      activeGuaranteeCount: eligibility?.activeGuaranteeCount ?? guaranteedCount,
      maxGuarantees: eligibility?.maxGuarantees,
    });
  }

  return byPhone;
}

export async function searchRecords(query: string, role: string): Promise<RecordSearchHit[]> {
  const q = query.trim();
  if (!q) return [];
  const borrowers = await listBorrowers();
  const hits: RecordSearchHit[] = [];
  const guarantorIndex = buildGuarantorHits(borrowers, role);

  for (const borrower of borrowers) {
    const profile = borrower.profile;
    if (
      matches(borrower.fullName, q) ||
      matches(borrower.id, q) ||
      matches(borrower.phone, q) ||
      matches(borrower.idNumber, q) ||
      matches(borrower.groupName, q) ||
      matches(borrower.community, q)
    ) {
      hits.push({
        kind: 'borrower',
        id: borrower.id,
        label: borrower.fullName,
        subtitle: `${borrower.phone} · ${borrower.community}`,
        href: hrefFor(role, borrower.id),
      });
    }
  }

  for (const borrower of borrowers) {
    const profile = borrower.profile;
    if (matches(profile.guarantorName, q) || matches(profile.guarantorPhone, q)) {
      const phone = profile.guarantorPhone?.trim();
      const key = phone ? normalizeGhanaPhone(phone) : `name:${profile.guarantorName?.toLowerCase() ?? ''}`;
      const hit = guarantorIndex.get(key);
      if (hit) hits.push(hit);
    }
  }

  const seen = new Set<string>();
  return hits
    .filter((hit) => {
      const key = `${hit.kind}:${hit.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 40);
}

export async function getGuarantorRecordFile(phoneKey: string, role: string): Promise<GuarantorRecordFile> {
  const normalizedPhone = normalizeGhanaPhone(decodeURIComponent(phoneKey));
  const borrowers = await listBorrowers();

  const guaranteed = borrowers.filter(
    (entry) =>
      ACTIVE_GUARANTEE_STATUSES.has(entry.status) &&
      isSameGuarantorPhone(entry, normalizedPhone),
  );

  const sample = borrowers.find((entry) => isSameGuarantorPhone(entry, normalizedPhone));
  if (!sample && guaranteed.length === 0) {
    throw new Error('NOT_FOUND');
  }

  const profileSource = sample ?? guaranteed[0]!;
  const guarantorName = profileSource.profile?.guarantorName ?? 'Guarantor';

  const eligibility = evaluateGuarantorEligibility(
    {
      guarantorPhone: normalizedPhone,
      guarantorName,
      borrowerPhone: '0240000999',
    },
    borrowers,
  );

  const asBorrower = borrowers.find(
    (entry) => normalizeGhanaPhone(entry.phone) === normalizedPhone,
  );

  let guarantorPhotoUrl: string | null = null;
  if (sample) {
    try {
      const review = await borrowerService.getBorrowerReviewDetail(sample.id);
      guarantorPhotoUrl = review.guarantorPhotoUrl ?? null;
    } catch {
      guarantorPhotoUrl = null;
    }
  }

  return {
    guarantorPhone: normalizedPhone,
    guarantorName,
    guarantorPhotoUrl,
    guarantorRelationship: profileSource.profile?.guarantorRelationship,
    activeGuaranteeCount: eligibility.activeGuaranteeCount,
    maxGuarantees: eligibility.maxGuarantees,
    isAlsoBorrower: Boolean(asBorrower),
    borrowerProfileId: asBorrower?.id,
    borrowerProfileName: asBorrower?.fullName,
    guaranteedBorrowers: guaranteed.map((entry) => ({
      borrowerId: entry.id,
      borrowerName: entry.fullName,
      phone: entry.phone,
      community: entry.community,
      status: entry.status,
      href: hrefFor(role, entry.id),
    })),
  };
}

export async function getBorrowerRecordFile(id: string) {
  const profile = await borrowerService.getBorrowerFullProfile(id);
  let reviewExtras: {
    photoUrl?: string | null;
    guarantorPhotoUrl?: string | null;
    idDocumentUrl?: string | null;
    gender?: string;
    email?: string;
    businessName?: string;
    businessAddress?: string;
    typeOfWork?: string;
    subDistrictUnit?: string;
    electoralArea?: string;
  } = {};

  try {
    const review = await borrowerService.getBorrowerReviewDetail(id);
    reviewExtras = {
      photoUrl: review.photoUrl,
      guarantorPhotoUrl: review.guarantorPhotoUrl,
      idDocumentUrl: review.idDocumentUrl,
      gender: review.gender,
      email: review.email,
      businessName: review.businessName,
      businessAddress: review.businessAddress,
      typeOfWork: review.typeOfWork,
      subDistrictUnit: review.subDistrictUnit,
      electoralArea: review.electoralArea,
    };
  } catch {
    reviewExtras = {};
  }

  const audit = (await listAuditEntries({ limit: 200 })).filter((entry) => entry.targetEntityId === id);
  const deliveries = await listMessageDeliveries({ limit: 200 });
  const notifications = deliveries.filter(
    (entry) => entry.borrowerId === id || entry.recipient === profile.phone,
  );

  const activeLoan =
    profile.loans?.find((loan) => loan.status === 'ACTIVE') ?? profile.loans?.[0] ?? null;

  let paymentLog: Awaited<ReturnType<typeof loanService.listLoanPaymentLog>> = [];
  let scheduleWeeks: Awaited<ReturnType<typeof loanService.getLoanSchedule>>['weeks'] = [];

  if (activeLoan) {
    try {
      paymentLog = await loanService.listLoanPaymentLog(activeLoan.id);
      const schedule = await loanService.getLoanSchedule(activeLoan.id);
      scheduleWeeks = schedule.weeks;
    } catch {
      paymentLog = [];
      scheduleWeeks = [];
    }
  }

  return {
    profile: {
      ...profile,
      ...reviewExtras,
    },
    audit,
    notifications,
    paymentLog,
    scheduleWeeks,
    activeLoanId: activeLoan?.id ?? null,
  };
}
