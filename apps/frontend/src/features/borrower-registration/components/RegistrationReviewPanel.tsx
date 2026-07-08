'use client';

import { useEffect, useMemo, useState } from 'react';
import { PERMISSION } from '@/constants/permissions';
import { WilmsExportActions } from '@/features/export/components/WilmsExportActions';
import { buildRegistrationAgreementExportDocument } from '@/features/export/builders/registration-agreement-document';
import { useWilmsExportActor } from '@/features/export/hooks/useWilmsExportActor';
import { RegistrationAgreementDocument } from '@/features/borrower-registration/components/RegistrationAgreementDocument';
import { settingsService } from '@/services';
import type { BorrowerRegistrationFormValues } from '@/types/borrower-registration';
import type { GuarantorEligibilityResult } from '@/types/guarantor-eligibility';
import type { RegistrationLegalConfig } from '@/types/registration-legal';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { useObjectUrl } from '@/hooks/useObjectUrl';
import {
  buildRegistrationAgreementContent,
  type RegistrationAgreementMedia,
} from '@/utils/registration-agreement-fields';
import { resolveRegistrationAgreementMedia } from '@/utils/registration-media';

export interface RegistrationReviewPanelProps {
  values: BorrowerRegistrationFormValues;
  guarantorEligibility: GuarantorEligibilityResult | null;
  officerName: string;
}

export function RegistrationReviewPanel({
  values,
  guarantorEligibility,
  officerName,
}: RegistrationReviewPanelProps) {
  const generatedBy = useWilmsExportActor();
  const [legalConfig, setLegalConfig] = useState<RegistrationLegalConfig | null>(null);
  const [resolvedMedia, setResolvedMedia] = useState<RegistrationAgreementMedia | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const borrowerPhotoUrl = useObjectUrl(values.photo);
  const guarantorPhotoUrl = useObjectUrl(values.guarantorPhoto);

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
    let cancelled = false;

    void resolveRegistrationAgreementMedia(values, {
      borrowerPhotoUrl,
      guarantorPhotoUrl,
    }).then((media) => {
      if (!cancelled) {
        setResolvedMedia(media);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [borrowerPhotoUrl, guarantorPhotoUrl, values]);

  const agreementContent = useMemo(() => {
    if (!legalConfig || !resolvedMedia) {
      return null;
    }

    return buildRegistrationAgreementContent(values, legalConfig, officerName, resolvedMedia);
  }, [legalConfig, officerName, resolvedMedia, values]);

  const exportDocument = useMemo(() => {
    if (!legalConfig || !resolvedMedia) {
      return null;
    }

    return buildRegistrationAgreementExportDocument({
      values,
      legal: legalConfig,
      officerName,
      agreementMedia: resolvedMedia,
      generatedBy,
    });
  }, [generatedBy, legalConfig, officerName, resolvedMedia, values]);

  if (isLoading || !legalConfig || !agreementContent || !exportDocument) {
    return <LoadingSpinner label="Loading registration review" className="py-wilms-4" />;
  }

  return (
    <section className="space-y-wilms-4">
      <div className="flex flex-wrap items-start justify-between gap-wilms-3">
        <div>
          <h2 className="text-heading-2 font-semibold text-text-primary">Review registration</h2>
          <p className="mt-wilms-1 text-body text-text-muted">
            Official agreement preview — signatures and thumbprints may be added digitally or after printing.
          </p>
        </div>
        <WilmsExportActions
          document={exportDocument}
          filenameBase={`registration-${values.fullName.replace(/\s+/g, '-').toLowerCase()}`}
          permissions={[PERMISSION.REGISTER_BORROWERS]}
        />
      </div>

      {guarantorEligibility ? (
        <p className="text-small text-text-muted">
          Guarantor capacity: {guarantorEligibility.activeGuaranteeCount} of{' '}
          {guarantorEligibility.maxGuarantees} · {guarantorEligibility.validationStatus}
        </p>
      ) : null}

      <RegistrationAgreementDocument content={agreementContent} />
    </section>
  );
}
