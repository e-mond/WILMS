'use client';

import { ExportDownloadIcon } from '@/components/icons/ExportDownloadIcon';
import type { PermissionId } from '@/constants/permissions';
import { PERMISSION } from '@/constants/permissions';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { Button } from '@/components/ui/Button';
import type { WilmsExportDocument } from '@/features/export/types';
import { downloadWilmsCsv } from '@/features/export/engines/csv-engine';
import { printWilmsDocument } from '@/features/export/engines/print-engine';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/utils/cn';
import { useState, useCallback } from 'react';

export interface WilmsExportActionsProps {
  document: WilmsExportDocument;
  filenameBase: string;
  className?: string;
  showIcons?: boolean;
  /** When set, export actions require any of these permissions. */
  permissions?: PermissionId[];
}

const PRINT_ERROR_MESSAGES = {
  iframe_unavailable: 'Printing is unavailable in this browser. Download PDF instead.',
  print_blocked: 'Printing was blocked. Download PDF or try again.',
  unknown: 'Unable to open the print dialog. Download PDF instead.',
} as const;

export function WilmsExportActions({
  document,
  filenameBase,
  className,
  showIcons = true,
  permissions = [PERMISSION.EXPORT_REPORTS],
}: WilmsExportActionsProps) {
  const toast = useToast();
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const handlePrint = useCallback(async () => {
    setIsExporting('print');
    const result = await printWilmsDocument(document);

    if (!result.ok) {
      toast.warning('Print unavailable', {
        message: PRINT_ERROR_MESSAGES[result.reason] ?? PRINT_ERROR_MESSAGES.unknown,
      });
    }
    setIsExporting(null);
  }, [document, toast]);

  const handleExcelExport = useCallback(async () => {
    setIsExporting('excel');
    try {
      const { downloadWilmsExcel } = await import('@/features/export/engines/excel-engine');
      await downloadWilmsExcel(document, `${filenameBase}.xlsx`);
    } catch {
      toast.error('Export failed', { message: 'Failed to generate Excel file.' });
    }
    setIsExporting(null);
  }, [document, filenameBase, toast]);

  const handlePdfExport = useCallback(async () => {
    setIsExporting('pdf');
    try {
      const { downloadWilmsPdf } = await import('@/features/export/engines/pdf-engine');
      await downloadWilmsPdf(document, `${filenameBase}.pdf`);
    } catch {
      toast.error('Export failed', { message: 'Failed to generate PDF file.' });
    }
    setIsExporting(null);
  }, [document, filenameBase, toast]);

  const handleCsvExport = useCallback(() => {
    try {
      downloadWilmsCsv(document, `${filenameBase}.csv`);
    } catch {
      toast.error('Export failed', { message: 'Failed to generate CSV file.' });
    }
  }, [document, filenameBase, toast]);

  const isBusy = isExporting !== null;

  const actions = (
    <div
      className={cn(
        'flex max-w-full shrink-0 gap-wilms-1.5 print:hidden',
        'max-sm:-mx-wilms-1 max-sm:overflow-x-auto max-sm:px-wilms-1 max-sm:pb-0.5 max-sm:[&>*]:shrink-0',
        'sm:flex-wrap sm:justify-end',
        className,
      )}
      role="group"
      aria-label="Export actions"
    >
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className={cn('whitespace-nowrap', showIcons && 'gap-wilms-2')}
        onClick={handleCsvExport}
        disabled={isBusy}
      >
        {showIcons && <ExportDownloadIcon />}
        <span className="sm:hidden">CSV</span>
        <span className="hidden sm:inline">Export CSV</span>
      </Button>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        className={cn('whitespace-nowrap', showIcons && 'gap-wilms-2')}
        onClick={() => void handleExcelExport()}
        disabled={isBusy}
        aria-busy={isExporting === 'excel'}
      >
        {showIcons && <ExportDownloadIcon />}
        <span className="sm:hidden">{isExporting === 'excel' ? '…' : 'Excel'}</span>
        <span className="hidden sm:inline">{isExporting === 'excel' ? 'Exporting…' : 'Export Excel'}</span>
      </Button>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="whitespace-nowrap"
        onClick={() => void handlePrint()}
        disabled={isBusy}
        aria-busy={isExporting === 'print'}
      >
        <span className="sm:hidden">{isExporting === 'print' ? '…' : 'Print'}</span>
        <span className="hidden sm:inline">{isExporting === 'print' ? 'Printing…' : 'Print'}</span>
      </Button>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="whitespace-nowrap"
        onClick={() => void handlePdfExport()}
        disabled={isBusy}
        aria-busy={isExporting === 'pdf'}
      >
        <span className="sm:hidden">{isExporting === 'pdf' ? '…' : 'PDF'}</span>
        <span className="hidden sm:inline">{isExporting === 'pdf' ? 'Downloading…' : 'Download PDF'}</span>
      </Button>
    </div>
  );

  if (!permissions.length) {
    return actions;
  }

  return <PermissionGate permissions={permissions}>{actions}</PermissionGate>;
}
