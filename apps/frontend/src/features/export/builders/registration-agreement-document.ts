import type { BorrowerRegistrationFormValues } from '@/types/borrower-registration';
import type { RegistrationLegalConfig } from '@/types/registration-legal';
import { WILMS_REPORT_TYPE, type WilmsExportDocument } from '@/features/export/types';
import { generateReportId } from '@/features/export/utils/report-id';
import { formatExportTimestamp } from '@/features/export/utils/formatters';
import {
  buildRegistrationAgreementContent,
  type RegistrationAgreementDocumentMeta,
  type RegistrationAgreementMedia,
} from '@/utils/registration-agreement-fields';

export interface RegistrationAgreementExportInput {
  values: BorrowerRegistrationFormValues;
  legal: RegistrationLegalConfig;
  officerName: string;
  agreementMedia: RegistrationAgreementMedia;
  generatedBy: string;
  meta?: RegistrationAgreementDocumentMeta;
}

export function buildRegistrationAgreementExportDocument(
  input: RegistrationAgreementExportInput,
): WilmsExportDocument {
  const content = buildRegistrationAgreementContent(
    input.values,
    input.legal,
    input.officerName,
    input.agreementMedia,
    {
      documentTitle: 'Borrower Registration Review',
      ...input.meta,
    },
  );

  const reportId = generateReportId(WILMS_REPORT_TYPE.BORROWER_PROFILE);

  return {
    metadata: {
      reportType: WILMS_REPORT_TYPE.BORROWER_PROFILE,
      reportTitle: content.documentTitle,
      reportId,
      generatedAt: formatExportTimestamp(),
      generatedBy: input.generatedBy,
      referencePrefix: 'WILMS-REG',
      entityRef: content.registrationReference ?? input.values.fullName,
    },
    registrationAgreement: content,
    sections: [
      {
        title: 'Application Information',
        type: 'summary',
        summaryItems: content.applicationRows.map((row) => ({
          label: row.label,
          value: row.value,
        })),
      },
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
        title: 'Documents',
        type: 'summary',
        summaryItems: content.documentRows.map((row) => ({
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
