'use client';

import { ExportDownloadIcon } from '@/components/icons/ExportDownloadIcon';
import type { PermissionId } from '@/constants/permissions';
import { PERMISSION } from '@/constants/permissions';
import {
  buildTabularExportDocument,
  useWilmsExportActor,
  WILMS_REPORT_TYPE,
} from '@/features/export';
import type { WilmsReportType } from '@/features/export';
import { WilmsExportTrigger } from '@/features/export/components/WilmsExportModal';
import type { WilmsExportFormat } from '@/features/export/hooks/useWilmsExport';
import { cn } from '@/utils/cn';
import { useMemo } from 'react';

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
  formats?: WilmsExportFormat[];
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
  label = 'Export',
  className,
  showDownloadIcon = false,
  formats,
  permissions = [PERMISSION.EXPORT_REPORTS],
}: ExportCsvButtonProps) {
  const actor = useWilmsExportActor();
  const resolvedActor = generatedBy ?? actor;
  const filenameBase = filename.replace(/\.csv$/i, '');

  const document = useMemo(
    () =>
      buildTabularExportDocument({
        reportType,
        reportTitle,
        generatedBy: resolvedActor,
        headers,
        rows,
        executiveSummary,
      }),
    [executiveSummary, headers, reportTitle, reportType, resolvedActor, rows],
  );

  return (
    <WilmsExportTrigger
      document={document}
      filenameBase={filenameBase}
      label={label}
      showIcon={showDownloadIcon}
      disabled={disabled || rows.length === 0}
      className={cn(showDownloadIcon && 'gap-wilms-2', className)}
      formats={formats}
      permissions={permissions}
    />
  );
}
