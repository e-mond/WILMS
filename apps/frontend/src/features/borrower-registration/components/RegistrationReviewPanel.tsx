'use client';

import { useEffect, useMemo, useState } from 'react';
import { PERMISSION } from '@/constants/permissions';
import { WilmsExportActions } from '@/features/export/components/WilmsExportActions';
import { buildBrandedExportFilenameBase, REGISTRATION_AGREEMENT_EXPORT_FORMATS } from '@/features/export';
import { buildRegistrationAgreementExportDocument } from '@/features/export/builders/registration-agreement-document';
import { useWilmsExportActor } from '@/features/export/hooks/useWilmsExportActor';
import { RegistrationAgreementDocument } from '@/features/borrower-registration/components/RegistrationAgreementDocument';
import { settingsService } from '@/services';
import type { BorrowerRegistrationFormValues } from '@/types/borrower-registration';
import type { GuarantorEligibilityResult } from '@/types/guarantor-eligibility';
import type { RegistrationLegalConfig } from '@/types/registration-legal';
import { InlinePanelSkeleton } from '@/components/feedback/PageSkeletons';
import {
  buildRegistrationAgreementContent,
  type RegistrationAgreementMedia,
} from '@/utils/registration-agreement-fields';
import { resolveRegistrationAgreementMedia } from '@/utils/registration-media';

export interface RegistrationReviewPanelProps {
  values: BorrowerRegistrationFormValues;
  guarantorEligibility: GuarantorEligibilityResult | null;
  officerName: string;
  selectedGuarantor?: import('@/types/guarantor-search').GuarantorLookupResult | null;
}

export function RegistrationReviewPanel({
  values,
  guarantorEligibility,
  officerName,
  selectedGuarantor = null,
}: RegistrationReviewPanelProps) {
  const generatedBy = useWilmsExportActor();
  const [legalConfig, setLegalConfig] = useState<RegistrationLegalConfig | null>(null);
  const [resolvedMedia, setResolvedMedia] = useState<RegistrationAgreementMedia | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    setIsLoading(true);

    void resolveRegistrationAgreementMedia(values).then((media) => {
      if (!cancelled) {
        setResolvedMedia(media);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [values]);

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
    return <InlinePanelSkeleton />;
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
          filenameBase={buildBrandedExportFilenameBase([
            'Borrower_Registration_Review',
            values.fullName,
          ])}
          permissions={[PERMISSION.REGISTER_BORROWERS]}
          formats={[...REGISTRATION_AGREEMENT_EXPORT_FORMATS]}
        />
      </div>

      {selectedGuarantor ? (
        <div className="rounded-sm border border-border bg-card px-wilms-3 py-wilms-2 text-small text-text-primary">
          <p className="font-semibold">Existing guarantor selected</p>
          <p>
            {selectedGuarantor.name}
            {selectedGuarantor.displayId ? ` · ${selectedGuarantor.displayId}` : ''}
          </p>
          <p className="text-text-muted">
            Phone: {selectedGuarantor.phoneDisplay}
            {selectedGuarantor.idType ? ` · ID: ${selectedGuarantor.idType.replace(/_/g, ' ')}` : ''}
          </p>
          {selectedGuarantor.guaranteedBorrowers.length > 0 ? (
            <p className="text-text-muted">
              Currently guaranteeing:{' '}
              {selectedGuarantor.guaranteedBorrowers
                .slice(0, 3)
                .map((entry) => `${entry.fullName} (${entry.displayId})`)
                .join('; ')}
            </p>
          ) : null}
        </div>
      ) : null}

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
