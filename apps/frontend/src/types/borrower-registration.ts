import type {
  BorrowerGender,
  BorrowerIdType,
} from '@/constants/borrower-registration';

export interface BorrowerRegistrationFormValues {
  fullName: string;
  dateOfBirth: string;
  gender: BorrowerGender | '';
  phone: string;
  email: string;
  nationality: string;
  idType: BorrowerIdType | '';
  idNumber: string;
  houseAddress: string;
  gpsAddress: string;
  city: string;
  region: string;
  district: string;
  businessName: string;
  businessAddress: string;
  typeOfWork: string;
  typeOfWorkOther?: string;
  guarantorName: string;
  guarantorPhone: string;
  guarantorRelationship: string;
  guarantorIdType: BorrowerIdType | '';
  guarantorIdNumber: string;
  guarantorPhoto: File | null;
  photo: File | null;
  /** Remote preview when editing an existing registration (not a File). */
  photoPreviewUrl?: string | null;
  guarantorPreviewUrl?: string | null;
  photoUploadId?: string;
  guarantorPhotoUploadId?: string;
  idDocument: File | null;
  idDocumentUploadId?: string;
  borrowerSignatureUploadId?: string;
  borrowerThumbprintUploadId?: string;
  guarantorSignatureUploadId?: string;
  guarantorThumbprintUploadId?: string;
  officerSignatureUploadId?: string;
  borrowerThumbprintManualPlaceholder?: boolean;
  guarantorThumbprintManualPlaceholder?: boolean;
}

export interface BorrowerRegistrationProfile {
  dateOfBirth: string;
  gender: BorrowerGender;
  email?: string;
  nationality: string;
  houseAddress: string;
  gpsAddress: string;
  city: string;
  region: string;
  district: string;
  businessName: string;
  businessAddress: string;
  typeOfWork: string;
  guarantorName: string;
  guarantorPhone: string;
  guarantorRelationship: string;
  photoFileName: string;
  photoMimeType: string;
  photoUploadId?: string;
  guarantorPhotoUploadId?: string;
}

export interface RegisterBorrowerPayload {
  registeredByOfficerId: string;
  fullName: string;
  dateOfBirth: string;
  gender: BorrowerGender;
  phone: string;
  email?: string;
  nationality: string;
  idType: BorrowerIdType;
  idNumber: string;
  houseAddress: string;
  gpsAddress: string;
  city: string;
  region: string;
  district: string;
  businessName: string;
  businessAddress: string;
  typeOfWork: string;
  guarantorName: string;
  guarantorPhone: string;
  guarantorRelationship: string;
  photoFileName: string;
  photoMimeType: string;
  photoUploadId?: string;
  guarantorPhotoUploadId?: string;
  idDocumentUploadId?: string;
  borrowerSignatureUploadId?: string;
  borrowerThumbprintUploadId?: string;
  guarantorSignatureUploadId?: string;
  guarantorThumbprintUploadId?: string;
  officerSignatureUploadId?: string;
}
