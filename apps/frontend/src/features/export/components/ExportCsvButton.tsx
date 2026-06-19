'use client';

import { ExportDownloadIcon } from '@/components/icons/ExportDownloadIcon';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { Button } from '@/components/ui/Button';
import type { PermissionId } from '@/constants/permissions';
import { PERMISSION } from '@/constants/permissions';
import {
  buildTabularExportDocument,
  downloadWilmsCsv,
  useWilmsExportActor,
  WILMS_REPORT_TYPE,
} from '@/features/export';
import type { WilmsReportType } from '@/features/export';
import { cn } from '@/utils/cn';
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/useToast';

export interface ExportCsvButtonProps {
  filename: string;
  headers: string[];
  rows: string[][];
  reportType?: WilmsReportType;
  reportTitle?: string;
  generatedBy?: string;
  executiveSummary?: string;
  disabled?: boolean;
  label?: string;
  className?: string;
  showDownloadIcon?: boolean;
  /** When set, export requires any of these permissions. */
  permissions?: PermissionId[];
}

export function ExportCsvButton({
  filename,
  headers,
  rows,
  reportType = WILMS_REPORT_TYPE.GENERIC_REPORT,
  reportTitle = 'WILMS Report Export',
  generatedBy,
  executiveSummary,
  disabled = false,
  label = 'Export CSV',
  className,
  showDownloadIcon = false,
  permissions = [PERMISSION.EXPORT_REPORTS],
}: ExportCsvButtonProps) {
  const toast = useToast();
  const actor = useWilmsExportActor();
  const resolvedActor = generatedBy ?? actor;
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (rows.length === 0) return;

    setIsExporting(true);

    try {
      const document = buildTabularExportDocument({
        reportType,
        reportTitle,
        generatedBy: resolvedActor,
        headers,
        rows,
        executiveSummary,
      });

      // Ensure filename has .csv extension
      const finalFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;

      downloadWilmsCsv(document, finalFilename);
    } catch (error) {
      console.error('CSV export failed:', error);
      toast.error('Export failed', {
        message: 'Unable to generate CSV file. Please try again.',
      });
    } finally {
      setIsExporting(false);
    }
  }, [filename, headers, rows, reportType, reportTitle, resolvedActor, executiveSummary, toast]);

  return (
    <PermissionGate permissions={permissions}>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={disabled || rows.length === 0 || isExporting}
        className={cn(showDownloadIcon && 'gap-wilms-2', className)}
        onClick={() => void handleExport()}
        aria-busy={isExporting}
      >
        {showDownloadIcon && <ExportDownloadIcon />}
        {isExporting ? 'Exporting…' : label}
      </Button>
    </PermissionGate>
  );
}