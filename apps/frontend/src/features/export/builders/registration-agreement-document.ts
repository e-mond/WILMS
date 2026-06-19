import type { BorrowerRegistrationFormValues } from '@/types/borrower-registration';
import type { RegistrationLegalConfig } from '@/types/registration-legal';
import { WILMS_REPORT_TYPE, type WilmsExportDocument } from '@/features/export/types';
import { generateReportId } from '@/features/export/utils/report-id';
import { getWilmsEnvironment } from '@/features/export/utils/environment';
import { formatExportTimestamp } from '@/features/export/utils/formatters';
import { buildRegistrationAgreementContent, type RegistrationAgreementMedia } from '@/utils/registration-agreement-fields';

export interface RegistrationAgreementExportInput {
  values: BorrowerRegistrationFormValues;
  legal: RegistrationLegalConfig;
  officerName: string;
  agreementMedia: RegistrationAgreementMedia;
  generatedBy: string;
}

export function buildRegistrationAgreementExportDocument(
  input: RegistrationAgreementExportInput,
): WilmsExportDocument {
  const content = buildRegistrationAgreementContent(
    input.values,
    input.legal,
    input.officerName,
    input.agreementMedia,
  );

  const reportId = generateReportId(WILMS_REPORT_TYPE.BORROWER_PROFILE);

  return {
    metadata: {
      reportType: WILMS_REPORT_TYPE.BORROWER_PROFILE,
      reportTitle: content.legal.formTitle,
      reportId,
      generatedAt: formatExportTimestamp(),
      generatedBy: input.generatedBy,
      environment: getWilmsEnvironment(),
      referencePrefix: 'WILMS-REG',
      entityRef: input.values.fullName,
    },
    registrationAgreement: content,
    sections: [
      {
        title: content.legal.programName,
        type: 'summary',
        summaryItems: content.applicantRows.map((row) => ({
          label: row.label,
          value: row.value,
        })),
      },
      {
        title: 'Work / Business Information',
        type: 'summary',
        summaryItems: content.workRows.map((row) => ({
          label: row.label,
          value: row.value,
        })),
      },
      {
        title: 'Guarantor Information',
        type: 'summary',
        summaryItems: content.guarantorRows.map((row) => ({
          label: row.label,
          value: row.value,
        })),
      },
      {
        title: 'Guarantor Declaration',
        type: 'summary',
        summaryItems: [{ label: 'Declaration', value: content.legal.guarantorDeclaration }],
      },
      {
        title: 'Borrower Declaration',
        type: 'summary',
        summaryItems: [{ label: 'Declaration', value: content.legal.borrowerDeclaration }],
      },
      {
        title: 'Key Terms & Enforcement',
        type: 'summary',
        summaryItems: [{ label: 'Terms', value: content.legal.keyTerms }],
      },
      {
        title: 'Legal Notice',
        type: 'summary',
        summaryItems: [{ label: 'Notice', value: content.legal.legalNotice }],
      },
    ],
    signatures: [
      { label: 'Borrower', name: input.values.fullName },
      { label: 'Guarantor', name: input.values.guarantorName },
      { label: 'Officer', name: input.officerName },
    ],
  };
}
