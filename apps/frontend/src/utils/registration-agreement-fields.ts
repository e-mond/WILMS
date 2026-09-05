import { buildLocationHierarchyRows, deriveCityTown } from '@/utils/location-hierarchy';
import type { BorrowerRegistrationFormValues } from '@/types/borrower-registration';
import type { RegistrationLegalConfig } from '@/types/registration-legal';

export interface AgreementFieldRow {
  label: string;
  value: string;
}

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
}

export interface RegistrationAgreementContent {
  legal: RegistrationLegalConfig;
  documentTitle: string;
  registrationReference: string | null;
  applicationStatus: string | null;
  hasIdDocument: boolean;
  generatedAt: string;
  applicantRows: AgreementFieldRow[];
  workRows: AgreementFieldRow[];
  guarantorRows: AgreementFieldRow[];
  applicationRows: AgreementFieldRow[];
  documentRows: AgreementFieldRow[];
  borrowerPhotoUrl: string | null;
  guarantorPhotoUrl: string | null;
  borrowerSignature: string | null;
  borrowerThumbprint: string | null;
  guarantorSignature: string | null;
  guarantorThumbprint: string | null;
  officerSignature: string | null;
  officerName: string;
  signedDate: string;
}

function display(value: string | null | undefined, fallback = 'Not provided'): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
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

export function buildRegistrationAgreementContent(
  values: BorrowerRegistrationFormValues,
  legal: RegistrationLegalConfig,
  officerName: string,
  media: RegistrationAgreementMedia,
  meta: RegistrationAgreementDocumentMeta = {},
): RegistrationAgreementContent {
  const registrationReference = resolveReadableRegistrationReference(meta.registrationReference);
  const applicationStatus = meta.applicationStatus?.trim() || null;
  const hasIdDocument = Boolean(meta.hasIdDocument);
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
    { label: 'Gender', value: display(values.gender) },
    { label: 'Phone', value: display(values.phone) },
    { label: 'Email', value: display(values.email) },
    { label: 'Nationality', value: display(values.nationality) },
    { label: 'ID Type', value: display(values.idType?.replace(/_/g, ' ')) },
    { label: 'ID Number', value: display(values.idNumber) },
    { label: 'Home Address', value: display(values.houseAddress) },
    { label: 'Ghana Digital Address / GPS', value: display(values.gpsAddress) },
    ...buildLocationHierarchyRows({
      region: values.region,
      district: values.district,
      subDistrictUnit: values.subDistrictUnit,
      electoralArea: values.electoralArea,
      community: values.city,
      city: deriveCityTown(values.district, values.city),
    }).map(([label, value]) => ({ label, value })),
  ];

  const workRows: AgreementFieldRow[] = [
    { label: 'Business Name', value: display(values.businessName) },
    { label: 'Type of Work', value: display(values.typeOfWork) },
    { label: 'Business Address', value: display(values.businessAddress) },
  ];

  const guarantorRows: AgreementFieldRow[] = [
    { label: 'Full Name', value: display(values.guarantorName) },
    { label: 'Relationship', value: display(values.guarantorRelationship) },
    { label: 'Contact', value: display(values.guarantorPhone) },
    { label: 'ID Type', value: display(values.guarantorIdType?.replace(/_/g, ' ')) },
    { label: 'ID Number', value: display(values.guarantorIdNumber) },
  ];

  const applicationRows: AgreementFieldRow[] = [
    {
      label: 'Registration Reference',
      value: registrationReference ?? 'Assigned after submission',
    },
    { label: 'Application Status', value: display(applicationStatus, 'Pending review') },
    { label: 'Registration Officer', value: display(officerName) },
    { label: 'Document Date', value: signedDate },
  ];

  const documentRows: AgreementFieldRow[] = [
    {
      label: 'Borrower Passport Photo',
      value: media.borrowerPhotoUrl ? 'Attached' : 'Not attached',
    },
    {
      label: 'Guarantor Passport Photo',
      value: media.guarantorPhotoUrl ? 'Attached' : 'Not attached',
    },
    {
      label: 'ID Document Attachment',
      value: hasIdDocument || Boolean(values.idDocumentUploadId)
        ? 'Attached'
        : 'Not attached',
    },
  ];

  return {
    legal,
    documentTitle: meta.documentTitle?.trim() || 'Borrower Registration Review',
    registrationReference,
    applicationStatus,
    hasIdDocument: hasIdDocument || Boolean(values.idDocumentUploadId),
    generatedAt,
    applicantRows,
    workRows,
    guarantorRows,
    applicationRows,
    documentRows,
    borrowerPhotoUrl: media.borrowerPhotoUrl,
    guarantorPhotoUrl: media.guarantorPhotoUrl,
    borrowerSignature: media.borrowerSignatureUrl ?? null,
    borrowerThumbprint: media.borrowerThumbprintManual ? null : media.borrowerThumbprintUrl ?? null,
    guarantorSignature: media.guarantorSignatureUrl ?? null,
    guarantorThumbprint: media.guarantorThumbprintManual ? null : media.guarantorThumbprintUrl ?? null,
    officerSignature: media.officerSignatureUrl ?? null,
    officerName,
    signedDate,
  };
}
