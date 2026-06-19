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

export interface RegistrationAgreementContent {
  legal: RegistrationLegalConfig;
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
  officerName: string;
  signedDate: string;
}

function display(value: string | null | undefined, fallback = 'Not provided'): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

export function buildRegistrationAgreementContent(
  values: BorrowerRegistrationFormValues,
  legal: RegistrationLegalConfig,
  officerName: string,
  media: RegistrationAgreementMedia,
): RegistrationAgreementContent {
  return {
    legal,
    applicantRows: [
      { label: 'Full Name', value: display(values.fullName) },
      { label: 'Date of Birth', value: display(values.dateOfBirth) },
      { label: 'Address', value: display(values.houseAddress) },
      { label: 'GPS Address', value: display(values.gpsAddress) },
      { label: 'City', value: display(values.city) },
      { label: 'Region', value: display(values.region) },
      { label: 'District', value: display(values.district) },
      { label: 'Phone', value: display(values.phone) },
      { label: 'Email', value: display(values.email) },
      { label: 'Nationality', value: display(values.nationality) },
      { label: 'ID Type', value: display(values.idType) },
      { label: 'ID Number', value: display(values.idNumber) },
      { label: 'Gender', value: display(values.gender) },
      { label: 'Occupation', value: display(values.typeOfWork) },
    ],
    workRows: [
      { label: 'Business Name', value: display(values.businessName) },
      { label: 'Employer', value: display(values.businessName, 'Self-employed') },
      { label: 'Work Address', value: display(values.businessAddress) },
      { label: 'Business Type', value: display(values.typeOfWork) },
    ],
    guarantorRows: [
      { label: 'Full Name', value: display(values.guarantorName) },
      { label: 'Relationship', value: display(values.guarantorRelationship) },
      { label: 'Contact', value: display(values.guarantorPhone) },
      { label: 'Nationality', value: display(values.nationality, 'Not recorded') },
      { label: 'ID Type', value: display(values.guarantorIdType) },
      { label: 'ID Number', value: display(values.guarantorIdNumber) },
    ],
    borrowerPhotoUrl: media.borrowerPhotoUrl,
    guarantorPhotoUrl: media.guarantorPhotoUrl,
    borrowerSignature: media.borrowerSignatureUrl ?? null,
    borrowerThumbprint: media.borrowerThumbprintManual ? null : media.borrowerThumbprintUrl ?? null,
    guarantorSignature: media.guarantorSignatureUrl ?? null,
    guarantorThumbprint: media.guarantorThumbprintManual ? null : media.guarantorThumbprintUrl ?? null,
    officerSignature: media.officerSignatureUrl ?? null,
    officerName,
    signedDate: new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  };
}
