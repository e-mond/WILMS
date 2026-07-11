import type { BorrowerRegistrationFormValues } from '@/types/borrower-registration';
import type { RegisterBorrowerPayload } from '@/types/borrower-registration';
import type { BorrowerRegistrationInput } from '@/features/borrower-registration/registration.schema';
import type { BorrowerReviewDetail } from '@/types/approval';

export const DEFAULT_REGISTRATION_VALUES: BorrowerRegistrationFormValues = {
  fullName: '',
  dateOfBirth: '',
  gender: '',
  phone: '',
  email: '',
  nationality: 'Ghanaian',
  idType: '',
  idNumber: '',
  idDocument: null,
  idDocumentUploadId: undefined,
  houseAddress: '',
  gpsAddress: '',
  city: '',
  region: '',
  district: '',
  businessName: '',
  businessAddress: '',
  typeOfWork: '',
  typeOfWorkOther: '',
  guarantorName: '',
  guarantorPhone: '',
  guarantorRelationship: '',
  guarantorIdType: '',
  guarantorIdNumber: '',
  guarantorPhoto: null,
  photo: null,
  photoUploadId: undefined,
  guarantorPhotoUploadId: undefined,
  borrowerSignatureUploadId: undefined,
  borrowerThumbprintUploadId: undefined,
  guarantorSignatureUploadId: undefined,
  guarantorThumbprintUploadId: undefined,
  officerSignatureUploadId: undefined,
  borrowerThumbprintManualPlaceholder: false,
  guarantorThumbprintManualPlaceholder: false,
};

export function reviewDetailToFormValues(detail: BorrowerReviewDetail): BorrowerRegistrationFormValues {
  return {
    ...DEFAULT_REGISTRATION_VALUES,
    fullName: detail.fullName ?? '',
    dateOfBirth: detail.dateOfBirth ?? '',
    gender: detail.gender ?? '',
    phone: detail.phone ?? '',
    email: detail.email ?? '',
    nationality: detail.nationality ?? 'Ghanaian',
    idType: detail.idType ?? '',
    idNumber: detail.idNumber ?? '',
    houseAddress: detail.houseAddress ?? '',
    gpsAddress: detail.gpsAddress ?? '',
    city: detail.city ?? '',
    region: detail.region ?? '',
    district: detail.district ?? '',
    businessName: detail.businessName ?? '',
    businessAddress: detail.businessAddress ?? '',
    typeOfWork: detail.typeOfWork ?? '',
    guarantorName: detail.guarantorName ?? '',
    guarantorPhone: detail.guarantorPhone ?? '',
    guarantorRelationship: detail.guarantorRelationship ?? '',
    photo: null,
    guarantorPhoto: null,
    photoPreviewUrl: detail.photoUrl ?? null,
    guarantorPreviewUrl: detail.guarantorPhotoUrl ?? null,
  };
}

function reviveFileField(value: unknown): File | null {
  if (!value) {
    return null;
  }

  if (typeof Blob !== 'undefined' && value instanceof File && value.size > 0) {
    return value;
  }

  return null;
}

/** Normalize draft JSON payloads restored from the API (photos are never real File instances). */
export function normalizeDraftFormValues(
  payload: Record<string, unknown>,
): BorrowerRegistrationFormValues {
  const merged = {
    ...DEFAULT_REGISTRATION_VALUES,
    ...(payload as Partial<BorrowerRegistrationFormValues>),
  };

  return {
    ...merged,
    photo: reviveFileField(payload.photo),
    guarantorPhoto: reviveFileField(payload.guarantorPhoto),
    idDocument: reviveFileField(payload.idDocument),
    photoPreviewUrl:
      typeof payload.photoPreviewUrl === 'string'
        ? payload.photoPreviewUrl
        : merged.photoPreviewUrl ?? null,
    guarantorPreviewUrl:
      typeof payload.guarantorPreviewUrl === 'string'
        ? payload.guarantorPreviewUrl
        : merged.guarantorPreviewUrl ?? null,
  };
}

export function toRegisterBorrowerPayload(
  input: BorrowerRegistrationInput,
  registeredByOfficerId: string,
): RegisterBorrowerPayload {
  return {
    registeredByOfficerId,
    fullName: input.fullName,
    dateOfBirth: input.dateOfBirth,
    gender: input.gender,
    phone: input.phone,
    email: input.email || undefined,
    nationality: input.nationality,
    idType: input.idType,
    idNumber: input.idNumber,
    houseAddress: input.houseAddress,
    gpsAddress: input.gpsAddress,
    city: input.city,
    region: input.region,
    district: input.district,
    businessName: input.businessName,
    businessAddress: input.businessAddress,
    typeOfWork:
      input.typeOfWork === 'Other' && input.typeOfWorkOther?.trim()
        ? input.typeOfWorkOther.trim()
        : input.typeOfWork,
    guarantorName: input.guarantorName,
    guarantorPhone: input.guarantorPhone,
    guarantorRelationship: input.guarantorRelationship,
    photoFileName: input.photoUploadId ?? input.photo.name,
    photoMimeType: input.photo.type,
    photoUploadId: input.photoUploadId,
    guarantorPhotoUploadId: input.guarantorPhotoUploadId,
    idDocumentUploadId: input.idDocumentUploadId,
    borrowerSignatureUploadId: input.borrowerSignatureUploadId,
    borrowerThumbprintUploadId: input.borrowerThumbprintUploadId,
    guarantorSignatureUploadId: input.guarantorSignatureUploadId,
    guarantorThumbprintUploadId: input.guarantorThumbprintUploadId,
    officerSignatureUploadId: input.officerSignatureUploadId,
  };
}
