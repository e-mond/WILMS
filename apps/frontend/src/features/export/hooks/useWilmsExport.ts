'use client';

import { useCallback, useState } from 'react';
import type { WilmsExportDocument } from '@/features/export/types';
import { buildWilmsCsvContent } from '@/features/export/engines/csv-engine';
import { buildExportFilename } from '@/features/export/utils/formatters';
import { useToast } from '@/hooks/useToast';

export type WilmsExportFormat = 'csv' | 'excel' | 'pdf' | 'word' | 'print' | 'copy';

const PRINT_ERROR_MESSAGES = {
  iframe_unavailable: 'Printing is unavailable in this browser. Download PDF instead.',
  print_blocked: 'Printing was blocked. Download PDF or try again.',
  unknown: 'Unable to open the print dialog. Download PDF instead.',
} as const;

export function useWilmsExport(document: WilmsExportDocument, filenameBase: string) {
  const toast = useToast();
  const [isExporting, setIsExporting] = useState<WilmsExportFormat | null>(null);

  const exportDocument = useCallback(
    async (format: WilmsExportFormat) => {
      setIsExporting(format);

      try {
        switch (format) {
          case 'csv': {
            const { downloadWilmsCsv } = await import('@/features/export/engines/csv-engine');
            downloadWilmsCsv(document, buildExportFilename(filenameBase, 'csv'));
            break;
          }
          case 'excel': {
            const { downloadWilmsExcel } = await import('@/features/export/engines/excel-engine');
            await downloadWilmsExcel(document, buildExportFilename(filenameBase, 'xlsx'));
            break;
          }
          case 'pdf': {
            const { downloadWilmsPdf } = await import('@/features/export/engines/pdf-engine');
            downloadWilmsPdf(document, buildExportFilename(filenameBase, 'pdf'));
            break;
          }
          case 'word': {
            const { downloadWilmsDocx } = await import('@/features/export/engines/docx-engine');
            await downloadWilmsDocx(document, buildExportFilename(filenameBase, 'docx'));
            break;
          }
          case 'print': {
            const { printWilmsDocument } = await import('@/features/export/engines/print-engine');
            const result = await printWilmsDocument(document);
            if (!result.ok) {
              toast.warning('Print unavailable', {
                message: PRINT_ERROR_MESSAGES[result.reason] ?? PRINT_ERROR_MESSAGES.unknown,
              });
            }
            break;
          }
          case 'copy': {
            const csv = buildWilmsCsvContent(document);
            await navigator.clipboard.writeText(csv);
            toast.success('Copied', { message: 'Export copied to clipboard as CSV.' });
            break;
          }
          default:
            throw new Error(`Unsupported export format: ${format satisfies never}`);
        }
      } catch (error) {
        console.error('Export failed:', error);
        toast.error('Export failed', { message: 'Unable to complete the export. Please try again.' });
      } finally {
        setIsExporting(null);
      }
    },
    [document, filenameBase, toast],
  );

  return {
    exportDocument,
    isExporting,
    isBusy: isExporting !== null,
  };
}
