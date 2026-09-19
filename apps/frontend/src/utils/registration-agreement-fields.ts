import { resolveOccupationLabel } from '@wilms/shared-contracts';
import { buildLocationHierarchyRows, deriveCityTown } from '@/utils/location-hierarchy';
import { resolveUserDisplayId } from '@/utils/entity-display-id';
import type { BorrowerRegistrationFormValues } from '@/types/borrower-registration';
import type { RegistrationLegalConfig } from '@/types/registration-legal';

export interface AgreementFieldRow {
  label: string;
  value: string;
}

export type SignatureCaptureMode = 'digital' | 'thumbprint' | 'manual';

export interface RegistrationAgreementMedia {
  borrowerPhotoUrl: string | null;
  guarantorPhotoUrl: string | null;
  borrowerSignatureUrl?: string | null;
  borrowerThumbprintUrl?: string | null;
  guarantorSignatureUrl?: string | null;
  guarantorThumbprintUrl?: string | null;
  officerSignatureUrl?: string | null;
  borrowerThumbprintManual?: boolean;
  guarantorThumbprintManual?: boolean;
}

export interface RegistrationAgreementDocumentMeta {
  /** Human-readable borrower reference (e.g. BRW-2026-00417). Never a raw UUID. */
  registrationReference?: string | null;
  applicationStatus?: string | null;
  hasIdDocument?: boolean;
  documentTitle?: string;
  /** Human-readable officer staff ID when available. */
  officerId?: string | null;
  /** Optional embedded brand logo data URL for deterministic PDF/print rendering. */
  logoDataUrl?: string | null;
}

export interface RegistrationAgreementContent {
  legal: RegistrationLegalConfig;
  documentTitle: string;
  registrationReference: string | null;
  applicationStatus: string | null;
  hasIdDocument: boolean;
  generatedAt: string;
  logoDataUrl: string | null;
  applicantRows: AgreementFieldRow[];
  workRows: AgreementFieldRow[];
  guarantorRows: AgreementFieldRow[];
  borrowerPhotoUrl: string | null;
  guarantorPhotoUrl: string | null;
  borrowerSignature: string | null;
  borrowerThumbprint: string | null;
  guarantorSignature: string | null;
  guarantorThumbprint: string | null;
  officerSignature: string | null;
  borrowerSignatureMode: SignatureCaptureMode;
  guarantorSignatureMode: SignatureCaptureMode;
  officerName: string;
  officerId: string | null;
  signedDate: string;
}

function display(value: string | null | undefined, fallback = 'Not provided'): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function humanizeToken(value: string | null | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    return 'Not provided';
  }

  return trimmed
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\bId\b/g, 'ID');
}

function looksLikeUuid(value: string | null | undefined): boolean {
  if (!value?.trim()) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim());
}

/** Prefer human-readable WILMS IDs; never expose raw UUIDs in the document. */
export function resolveReadableRegistrationReference(
  reference: string | null | undefined,
): string | null {
  const trimmed = reference?.trim();
  if (!trimmed || looksLikeUuid(trimmed)) {
    return null;
  }
  return trimmed;
}

function resolveReadableOfficerId(officerId: string | null | undefined): string | null {
  const trimmed = officerId?.trim();
  if (!trimmed) {
    return null;
  }

  if (looksLikeUuid(trimmed)) {
    return resolveUserDisplayId(trimmed);
  }

  return trimmed;
}

export function resolveSignatureCaptureMode(input: {
  signatureUrl?: string | null;
  thumbprintUrl?: string | null;
  manual?: boolean;
}): SignatureCaptureMode {
  if (input.manual) {
    return 'manual';
  }
  if (input.signatureUrl?.trim()) {
    return 'digital';
  }
  if (input.thumbprintUrl?.trim()) {
    return 'thumbprint';
  }
  return 'manual';
}

export function buildRegistrationAgreementContent(
  values: BorrowerRegistrationFormValues,
  legal: RegistrationLegalConfig,
  officerName: string,
  media: RegistrationAgreementMedia,
  meta: RegistrationAgreementDocumentMeta = {},
): RegistrationAgreementContent {
  const registrationReference = resolveReadableRegistrationReference(meta.registrationReference);
  const applicationStatus = meta.applicationStatus?.trim() || null;
  const hasIdDocument = Boolean(meta.hasIdDocument) || Boolean(values.idDocumentUploadId);
  const officerId = resolveReadableOfficerId(meta.officerId);
  const generatedAt = new Date().toLocaleString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const signedDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const applicantRows: AgreementFieldRow[] = [
    { label: 'Full Name', value: display(values.fullName) },
    { label: 'Date of Birth', value: display(values.dateOfBirth) },
    { label: 'Gender', value: humanizeToken(values.gender) },
    { label: 'Phone Number', value: display(values.phone) },
    { label: 'Email', value: display(values.email) },
    { label: 'Nationality', value: display(values.nationality) },
    { label: 'Identification Type', value: humanizeToken(values.idType) },
    {
      label:
        values.idType === 'VOTER_ID' ? 'Voter ID Number' : 'Identification Number',
      value: display(values.idNumber),
    },
    { label: 'Residential Address', value: display(values.houseAddress) },
    { label: 'Ghana Digital Address', value: display(values.gpsAddress) },
    ...buildLocationHierarchyRows({
      region: values.region,
      district: values.district,
      subDistrictUnit: values.subDistrictUnit,
      electoralArea: values.electoralArea,
      community: values.city,
      city: deriveCityTown(values.district, values.city),
    }).map(([label, value]) => ({ label, value })),
  ];

  const workType = resolveOccupationLabel(values.typeOfWork, values.typeOfWorkOther);

  const workRows: AgreementFieldRow[] = [
    { label: 'Business Type / Occupation', value: display(workType) },
    { label: 'Business Name', value: display(values.businessName, 'Not provided') },
    {
      label: 'House / Stall / Shop Number',
      value: display(values.businessPremisesNumber, 'Not provided'),
    },
    { label: 'Business Address', value: display(values.businessAddress) },
  ];

  const guarantorRows: AgreementFieldRow[] = [
    { label: 'Full Name', value: display(values.guarantorName) },
    { label: 'Contact', value: display(values.guarantorPhone) },
    { label: 'Relationship', value: display(values.guarantorRelationship) },
    { label: 'ID Type', value: humanizeToken(values.guarantorIdType) },
    {
      label:
        values.guarantorIdType === 'VOTER_ID' ? 'Voter ID Number' : 'ID Number',
      value: display(values.guarantorIdNumber),
    },
  ];

  const borrowerSignatureMode = resolveSignatureCaptureMode({
    signatureUrl: media.borrowerSignatureUrl,
    thumbprintUrl: media.borrowerThumbprintManual ? null : media.borrowerThumbprintUrl,
    manual:
      Boolean(media.borrowerThumbprintManual) ||
      (!media.borrowerSignatureUrl && !media.borrowerThumbprintUrl),
  });
  const guarantorSignatureMode = resolveSignatureCaptureMode({
    signatureUrl: media.guarantorSignatureUrl,
    thumbprintUrl: media.guarantorThumbprintManual ? null : media.guarantorThumbprintUrl,
    manual:
      Boolean(media.guarantorThumbprintManual) ||
      (!media.guarantorSignatureUrl && !media.guarantorThumbprintUrl),
  });

  return {
    legal,
    documentTitle: meta.documentTitle?.trim() || legal.formTitle || 'LOAN APPLICATION & AGREEMENT FORM',
    registrationReference,
    applicationStatus,
    hasIdDocument,
    generatedAt,
    logoDataUrl: meta.logoDataUrl?.trim() || null,
    applicantRows,
    workRows,
    guarantorRows,
    borrowerPhotoUrl: media.borrowerPhotoUrl,
    guarantorPhotoUrl: media.guarantorPhotoUrl,
    borrowerSignature:
      borrowerSignatureMode === 'digital' ? media.borrowerSignatureUrl ?? null : null,
    borrowerThumbprint:
      borrowerSignatureMode === 'thumbprint' ? media.borrowerThumbprintUrl ?? null : null,
    guarantorSignature:
      guarantorSignatureMode === 'digital' ? media.guarantorSignatureUrl ?? null : null,
    guarantorThumbprint:
      guarantorSignatureMode === 'thumbprint' ? media.guarantorThumbprintUrl ?? null : null,
    officerSignature: media.officerSignatureUrl ?? null,
    borrowerSignatureMode,
    guarantorSignatureMode,
    officerName,
    officerId,
    signedDate,
  };
}
