import type { BorrowerRegistrationFormValues } from '@/types/borrower-registration';
import type { RegistrationAgreementMedia } from '@/utils/registration-agreement-fields';
import { API_BASE_URL } from '@/config/api';
import { resolveMediaPreviewUrl } from '@/utils/media-preview';
import { resolveUploadPreviewUrl } from '@/utils/upload-file';

function absoluteMediaUrl(url: string): string {
  const trimmed = url.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  if (API_BASE_URL) {
    return `${API_BASE_URL}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
  }

  return trimmed;
}

async function resolvePhotoFromValues(
  file: File | null,
  previewUrl: string | null | undefined,
  uploadId: string | undefined,
): Promise<string | null> {
  const fromFile = resolveMediaPreviewUrl(file);
  if (fromFile) {
    return fromFile;
  }

  // Prefer resolving via upload service so Cloudinary/local URLs stay authoritative.
  if (uploadId?.trim()) {
    const fromUpload = await resolveUploadPreviewUrl(uploadId);
    if (fromUpload) {
      return absoluteMediaUrl(fromUpload);
    }
  }

  if (previewUrl?.trim()) {
    return absoluteMediaUrl(previewUrl);
  }

  return null;
}

export async function resolveRegistrationAgreementMedia(
  values: BorrowerRegistrationFormValues,
): Promise<RegistrationAgreementMedia> {
  const [
    borrowerPhotoUrl,
    guarantorPhotoUrl,
    borrowerSignatureUrl,
    borrowerThumbprintUrl,
    guarantorSignatureUrl,
    guarantorThumbprintUrl,
    officerSignatureUrl,
  ] = await Promise.all([
    resolvePhotoFromValues(values.photo, values.photoPreviewUrl, values.photoUploadId),
    resolvePhotoFromValues(
      values.guarantorPhoto,
      values.guarantorPreviewUrl,
      values.guarantorPhotoUploadId,
    ),
    resolveUploadPreviewUrl(values.borrowerSignatureUploadId).then((url) =>
      url ? absoluteMediaUrl(url) : null,
    ),
    resolveUploadPreviewUrl(values.borrowerThumbprintUploadId).then((url) =>
      url ? absoluteMediaUrl(url) : null,
    ),
    resolveUploadPreviewUrl(values.guarantorSignatureUploadId).then((url) =>
      url ? absoluteMediaUrl(url) : null,
    ),
    resolveUploadPreviewUrl(values.guarantorThumbprintUploadId).then((url) =>
      url ? absoluteMediaUrl(url) : null,
    ),
    resolveUploadPreviewUrl(values.officerSignatureUploadId).then((url) =>
      url ? absoluteMediaUrl(url) : null,
    ),
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
