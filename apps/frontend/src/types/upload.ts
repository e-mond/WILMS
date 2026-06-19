export const UPLOAD_PURPOSE = {
  PROFILE_PHOTO: 'profile-photo',
  BORROWER_PHOTO: 'borrower-photo',
  GUARANTOR_PHOTO: 'guarantor-photo',
  DOCUMENT: 'document',
  REGISTRATION_ATTACHMENT: 'registration-attachment',
  SIGNATURE: 'signature',
  THUMBPRINT: 'thumbprint',
} as const;

export type UploadPurpose = (typeof UPLOAD_PURPOSE)[keyof typeof UPLOAD_PURPOSE];

export interface UploadFileInput {
  purpose: UploadPurpose;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  /** Base64 data URL for mock uploads; API mode sends multipart separately. */
  dataUrl?: string;
  entityId?: string;
}

export interface UploadRecord {
  id: string;
  purpose: UploadPurpose;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  entityId?: string;
  uploadedAt: string;
}
