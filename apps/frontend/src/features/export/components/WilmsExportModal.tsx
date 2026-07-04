'use client';

import { ExportDownloadIcon } from '@/components/icons/ExportDownloadIcon';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { PermissionId } from '@/constants/permissions';
import { PERMISSION } from '@/constants/permissions';
import type { WilmsExportDocument } from '@/features/export/types';
import {
  useWilmsExport,
  type WilmsExportFormat,
} from '@/features/export/hooks/useWilmsExport';
import { cn } from '@/utils/cn';
import { useMemo, useState } from 'react';

export interface WilmsExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: WilmsExportDocument;
  filenameBase: string;
  formats?: WilmsExportFormat[];
}

const DEFAULT_FORMATS: WilmsExportFormat[] = ['csv', 'excel', 'pdf', 'word', 'print', 'copy'];

const FORMAT_LABELS: Record<WilmsExportFormat, string> = {
  csv: 'CSV',
  excel: 'Excel',
  pdf: 'PDF',
  word: 'Word',
  print: 'Print',
  copy: 'Copy CSV',
};

export function WilmsExportModal({
  isOpen,
  onClose,
  document,
  filenameBase,
  formats = DEFAULT_FORMATS,
}: WilmsExportModalProps) {
  const { exportDocument, isExporting, isBusy } = useWilmsExport(document, filenameBase);
  const availableFormats = useMemo(() => formats.filter(Boolean), [formats]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export">
      <p className="text-body text-text-muted">
        Choose a format for <strong className="text-text-primary">{document.metadata.reportTitle}</strong>.
      </p>
      <div className="mt-wilms-4 grid gap-wilms-2 sm:grid-cols-2">
        {availableFormats.map((format) => (
          <Button
            key={format}
            type="button"
            variant="secondary"
            className="justify-start"
            disabled={isBusy}
            aria-busy={isExporting === format}
            onClick={() => {
              void exportDocument(format).then(() => {
                onClose();
              });
            }}
          >
            {isExporting === format ? 'Exporting…' : FORMAT_LABELS[format]}
          </Button>
        ))}
      </div>
    </Modal>
  );
}

export interface WilmsExportTriggerProps {
  document: WilmsExportDocument;
  filenameBase: string;
  className?: string;
  label?: string;
  showIcon?: boolean;
  disabled?: boolean;
  formats?: WilmsExportFormat[];
  permissions?: PermissionId[];
}

export function WilmsExportTrigger({
  document,
  filenameBase,
  className,
  label = 'Export',
  showIcon = true,
  disabled = false,
  formats,
  permissions = [PERMISSION.EXPORT_REPORTS],
}: WilmsExportTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const trigger = (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className={cn(showIcon && 'gap-wilms-2', className)}
        disabled={disabled}
        onClick={() => setIsOpen(true)}
      >
        {showIcon && <ExportDownloadIcon />}
        {label}
      </Button>
      <WilmsExportModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        document={document}
        filenameBase={filenameBase}
        formats={formats}
      />
    </>
  );

  if (!permissions.length) {
    return trigger;
  }

  return <PermissionGate permissions={permissions}>{trigger}</PermissionGate>;
}
