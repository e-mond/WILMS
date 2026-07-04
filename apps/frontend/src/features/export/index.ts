import type { WilmsExportDocument } from '@/features/export/types';
import { downloadWilmsCsv } from '@/features/export/engines/csv-engine';
import { downloadWilmsExcel } from '@/features/export/engines/excel-engine';
import { downloadWilmsPdf } from '@/features/export/engines/pdf-engine';
import { openWilmsPrintPreview, printWilmsDocument } from '@/features/export/engines/print-engine';
export type { WilmsExportDocument, TabularExportInput, WilmsReportType } from '@/features/export/types';
export { WILMS_REPORT_TYPE } from '@/features/export/types';
export { buildGroupProfileExportDocument } from '@/features/export/builders/group-profile-document';
export { buildBorrowerProfileExportDocument, type BorrowerExportVariant, type BorrowerProfileExportInput } from '@/features/export/builders/borrower-profile-document';
export { buildRiskFlagsExportDocument, type RiskFlagsExportInput } from '@/features/export/builders/risk-flags-document';
export { buildRegistrationAgreementExportDocument, type RegistrationAgreementExportInput } from '@/features/export/builders/registration-agreement-document';
export { buildSettingsExportDocument, type SettingsExportInput } from '@/features/export/builders/settings-document';
export { buildTabularExportDocument } from '@/features/export/builders/tabular-export-document';
export { buildDashboardExportDocument } from '@/features/export/builders/dashboard-export-document';
export {
  buildWilmsCsvContent,
  buildCsvContent,
  downloadWilmsCsv,
  downloadCsvFile,
  escapeCsvCell,
} from '@/features/export/engines/csv-engine';
export { downloadWilmsExcel } from '@/features/export/engines/excel-engine';
export { downloadWilmsPdf } from '@/features/export/engines/pdf-engine';
export { buildWilmsPrintHtml, printWilmsDocument, openWilmsPrintPreview } from '@/features/export/engines/print-engine';
export type { WilmsPrintFailureReason, WilmsPrintResult } from '@/features/export/engines/print-engine';
export {
  formatExportDate,
  formatExportTimestamp,
  formatPesewasForCsv,
  formatPesewasForExport,
  formatPercentForExport,
  buildExportFilename,
} from '@/features/export/utils/formatters';
export { generateReportId, resetReportIdSequence } from '@/features/export/utils/report-id';
export { getWilmsEnvironment } from '@/features/export/utils/environment';
export { useWilmsExportActor } from '@/features/export/hooks/useWilmsExportActor';
export { useWilmsExport, type WilmsExportFormat } from '@/features/export/hooks/useWilmsExport';
export { ExportCsvButton, type ExportCsvButtonProps } from '@/features/export/components/ExportCsvButton';
export { WilmsExportActions, type WilmsExportActionsProps } from '@/features/export/components/WilmsExportActions';
export {
  WilmsExportModal,
  WilmsExportTrigger,
  type WilmsExportModalProps,
  type WilmsExportTriggerProps,
} from '@/features/export/components/WilmsExportModal';
export { downloadWilmsDocx } from '@/features/export/engines/docx-engine';

export async function exportWilmsDocument(
  document: WilmsExportDocument,
  format: 'csv' | 'excel' | 'pdf' | 'word' | 'print' | 'print-preview',
  filename: string,
): Promise<void> {
  switch (format) {
    case 'csv':
      downloadWilmsCsv(document, filename);
      return;
    case 'excel':
      await downloadWilmsExcel(document, filename);
      return;
    case 'pdf':
      downloadWilmsPdf(document, filename);
      return;
    case 'word': {
      const { downloadWilmsDocx } = await import('@/features/export/engines/docx-engine');
      await downloadWilmsDocx(document, filename);
      return;
    }
    case 'print':
      await printWilmsDocument(document);
      return;
    case 'print-preview':
      openWilmsPrintPreview(document);
      return;
    default:
      throw new Error(`Unsupported export format: ${format satisfies never}`);
  }
}
