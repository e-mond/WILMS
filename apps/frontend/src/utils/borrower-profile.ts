import type {
  BorrowerRegistrationProfile,
  RegisterBorrowerPayload,
} from '@/types/borrower-registration';

export function profileFromRegistrationPayload(
  payload: RegisterBorrowerPayload,
): BorrowerRegistrationProfile {
  return {
    dateOfBirth: payload.dateOfBirth,
    gender: payload.gender,
    email: payload.email,
    nationality: payload.nationality,
    houseAddress: payload.houseAddress,
    gpsAddress: payload.gpsAddress,
    city: payload.city,
    region: payload.region,
    district: payload.district,
    businessName: payload.businessName,
    businessAddress: payload.businessAddress,
    typeOfWork: payload.typeOfWork,
    guarantorName: payload.guarantorName,
    guarantorPhone: payload.guarantorPhone,
    guarantorRelationship: payload.guarantorRelationship,
    photoFileName: payload.photoFileName,
    photoMimeType: payload.photoMimeType,
    photoUploadId: payload.photoUploadId,
    guarantorPhotoUploadId: payload.guarantorPhotoUploadId,
  };
}
