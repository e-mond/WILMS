'use client';

import { useEffect, useMemo, useState } from 'react';
import { buildRegistrationAgreementExportDocument } from '@/features/export/builders/registration-agreement-document';
import { useWilmsExportActor } from '@/features/export/hooks/useWilmsExportActor';
import { reviewDetailToFormValues } from '@/features/borrower-registration/registration.utils';
import { settingsService } from '@/services';
import type { BorrowerReviewDetail } from '@/types/approval';
import type { WilmsExportDocument } from '@/features/export/types';
import type { RegistrationLegalConfig } from '@/types/registration-legal';
import type { RegistrationAgreementMedia } from '@/utils/registration-agreement-fields';
import { resolveRegistrationAgreementMedia } from '@/utils/registration-media';

export function useRegistrationAgreementExportDocument(
  detail: BorrowerReviewDetail | undefined,
  officerName: string,
): WilmsExportDocument | null {
  const generatedBy = useWilmsExportActor();
  const [legalConfig, setLegalConfig] = useState<RegistrationLegalConfig | null>(null);
  const [agreementMedia, setAgreementMedia] = useState<RegistrationAgreementMedia | null>(null);

  useEffect(() => {
    let cancelled = false;

    void settingsService.getRegistrationLegalConfig().then((legal) => {
      if (!cancelled) {
        setLegalConfig(legal);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!detail) {
      setAgreementMedia(null);
      return;
    }

    let cancelled = false;
    const values = reviewDetailToFormValues(detail);

    void resolveRegistrationAgreementMedia(values).then((media) => {
      if (!cancelled) {
        setAgreementMedia(media);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [detail]);

  return useMemo(() => {
    if (!detail || !legalConfig || !agreementMedia) {
      return null;
    }

    const values = reviewDetailToFormValues(detail);

    return buildRegistrationAgreementExportDocument({
      values,
      legal: legalConfig,
      officerName: officerName || detail.registeredByOfficerName,
      agreementMedia,
      generatedBy,
    });
  }, [agreementMedia, detail, generatedBy, legalConfig, officerName]);
}
