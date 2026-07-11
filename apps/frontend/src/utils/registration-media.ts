import type { BorrowerRegistrationFormValues } from '@/types/borrower-registration';
import type { RegistrationAgreementMedia } from '@/utils/registration-agreement-fields';
import { resolveMediaPreviewUrl } from '@/utils/media-preview';
import { resolveUploadPreviewUrl } from '@/utils/upload-file';

async function resolvePhotoFromValues(
  file: File | null,
  previewUrl: string | null | undefined,
  uploadId: string | undefined,
): Promise<string | null> {
  const fromFile = resolveMediaPreviewUrl(file);
  if (fromFile) {
    return fromFile;
  }

  if (previewUrl?.trim()) {
    return previewUrl.trim();
  }

  if (uploadId?.trim()) {
    return resolveUploadPreviewUrl(uploadId);
  }

  return null;
}

export async function resolveRegistrationAgreementMedia(
  values: BorrowerRegistrationFormValues,
): Promise<RegistrationAgreementMedia> {
  const [borrowerPhotoUrl, guarantorPhotoUrl, borrowerSignatureUrl, borrowerThumbprintUrl, guarantorSignatureUrl, guarantorThumbprintUrl, officerSignatureUrl] =
    await Promise.all([
      resolvePhotoFromValues(values.photo, values.photoPreviewUrl, values.photoUploadId),
      resolvePhotoFromValues(values.guarantorPhoto, values.guarantorPreviewUrl, values.guarantorPhotoUploadId),
      resolveUploadPreviewUrl(values.borrowerSignatureUploadId),
      resolveUploadPreviewUrl(values.borrowerThumbprintUploadId),
      resolveUploadPreviewUrl(values.guarantorSignatureUploadId),
      resolveUploadPreviewUrl(values.guarantorThumbprintUploadId),
      resolveUploadPreviewUrl(values.officerSignatureUploadId),
    ]);

  return {
    borrowerPhotoUrl,
    guarantorPhotoUrl,
    borrowerSignatureUrl,
    borrowerThumbprintUrl,
    guarantorSignatureUrl,
    guarantorThumbprintUrl,
    officerSignatureUrl,
    borrowerThumbprintManual: values.borrowerThumbprintManualPlaceholder,
    guarantorThumbprintManual: values.guarantorThumbprintManualPlaceholder,
  };
}
