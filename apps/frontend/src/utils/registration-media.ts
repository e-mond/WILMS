import type { BorrowerRegistrationFormValues } from '@/types/borrower-registration';
import type { RegistrationAgreementMedia } from '@/utils/registration-agreement-fields';
import { resolveUploadPreviewUrl } from '@/utils/upload-file';

export async function resolveRegistrationAgreementMedia(
  values: BorrowerRegistrationFormValues,
  photoUrls: { borrowerPhotoUrl: string | null; guarantorPhotoUrl: string | null },
): Promise<RegistrationAgreementMedia> {
  const [
    borrowerSignatureUrl,
    borrowerThumbprintUrl,
    guarantorSignatureUrl,
    guarantorThumbprintUrl,
    officerSignatureUrl,
  ] = await Promise.all([
    resolveUploadPreviewUrl(values.borrowerSignatureUploadId),
    resolveUploadPreviewUrl(values.borrowerThumbprintUploadId),
    resolveUploadPreviewUrl(values.guarantorSignatureUploadId),
    resolveUploadPreviewUrl(values.guarantorThumbprintUploadId),
    resolveUploadPreviewUrl(values.officerSignatureUploadId),
  ]);

  return {
    ...photoUrls,
    borrowerSignatureUrl,
    borrowerThumbprintUrl,
    guarantorSignatureUrl,
    guarantorThumbprintUrl,
    officerSignatureUrl,
    borrowerThumbprintManual: values.borrowerThumbprintManualPlaceholder,
    guarantorThumbprintManual: values.guarantorThumbprintManualPlaceholder,
  };
}
