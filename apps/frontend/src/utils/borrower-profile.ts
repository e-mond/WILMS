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
    subDistrictUnit: payload.subDistrictUnit,
    electoralArea: payload.electoralArea,
    businessName: payload.businessName,
    businessPremisesNumber: payload.businessPremisesNumber,
    businessAddress: payload.businessAddress,
    typeOfWork: payload.typeOfWork,
    typeOfWorkOther: payload.typeOfWorkOther,
    guarantorName: payload.guarantorName,
    guarantorPhone: payload.guarantorPhone,
    guarantorRelationship: payload.guarantorRelationship,
    guarantorIdType: payload.guarantorIdType,
    guarantorIdNumber: payload.guarantorIdNumber,
    photoFileName: payload.photoFileName,
    photoMimeType: payload.photoMimeType,
    photoUploadId: payload.photoUploadId,
    guarantorPhotoUploadId: payload.guarantorPhotoUploadId,
    idDocumentUploadId: payload.idDocumentUploadId,
    borrowerSignatureUploadId: payload.borrowerSignatureUploadId,
    borrowerThumbprintUploadId: payload.borrowerThumbprintUploadId,
    guarantorSignatureUploadId: payload.guarantorSignatureUploadId,
    guarantorThumbprintUploadId: payload.guarantorThumbprintUploadId,
    officerSignatureUploadId: payload.officerSignatureUploadId,
    borrowerThumbprintManual: Boolean(payload.borrowerThumbprintManualPlaceholder),
    guarantorThumbprintManual: Boolean(payload.guarantorThumbprintManualPlaceholder),
  };
}
