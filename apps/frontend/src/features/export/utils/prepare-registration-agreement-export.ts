import {
  absolutePublicAssetUrl,
  resolveAssetDataUrl,
  resolveWilmsBrandLogoDataUrl,
} from '@/features/export/utils/asset-data-url';
import { WILMS_BRAND_LOGO_PATH } from '@/features/export/constants/branding';
import type { RegistrationAgreementContent } from '@/utils/registration-agreement-fields';

/**
 * Embed logo and photographs as data URLs so PDF/print never inherit theme CSS
 * and never fail on relative asset paths inside isolated iframes.
 */
export async function prepareRegistrationAgreementForExport(
  content: RegistrationAgreementContent,
): Promise<RegistrationAgreementContent> {
  const [
    logoDataUrl,
    borrowerPhotoUrl,
    guarantorPhotoUrl,
    borrowerSignature,
    borrowerThumbprint,
    guarantorSignature,
    guarantorThumbprint,
    officerSignature,
  ] = await Promise.all([
    content.logoDataUrl
      ? Promise.resolve(content.logoDataUrl)
      : resolveWilmsBrandLogoDataUrl(),
    resolveAssetDataUrl(content.borrowerPhotoUrl),
    resolveAssetDataUrl(content.guarantorPhotoUrl),
    resolveAssetDataUrl(content.borrowerSignature),
    resolveAssetDataUrl(content.borrowerThumbprint),
    resolveAssetDataUrl(content.guarantorSignature),
    resolveAssetDataUrl(content.guarantorThumbprint),
    resolveAssetDataUrl(content.officerSignature),
  ]);

  return {
    ...content,
    logoDataUrl: logoDataUrl ?? absolutePublicAssetUrl(WILMS_BRAND_LOGO_PATH),
    borrowerPhotoUrl: borrowerPhotoUrl ?? content.borrowerPhotoUrl,
    guarantorPhotoUrl: guarantorPhotoUrl ?? content.guarantorPhotoUrl,
    borrowerSignature: borrowerSignature ?? content.borrowerSignature,
    borrowerThumbprint: borrowerThumbprint ?? content.borrowerThumbprint,
    guarantorSignature: guarantorSignature ?? content.guarantorSignature,
    guarantorThumbprint: guarantorThumbprint ?? content.guarantorThumbprint,
    officerSignature: officerSignature ?? content.officerSignature,
  };
}
