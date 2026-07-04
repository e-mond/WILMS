'use client';

import type { PermissionId } from '@/constants/permissions';
import { PERMISSION } from '@/constants/permissions';
import { WilmsExportTrigger } from '@/features/export/components/WilmsExportModal';
import type { WilmsExportDocument } from '@/features/export/types';
import { cn } from '@/utils/cn';

export interface WilmsExportActionsProps {
  document: WilmsExportDocument;
  filenameBase: string;
  className?: string;
  showIcons?: boolean;
  /** When set, export actions require any of these permissions. */
  permissions?: PermissionId[];
}

export function WilmsExportActions({
  document,
  filenameBase,
  className,
  showIcons = true,
  permissions = [PERMISSION.EXPORT_REPORTS],
}: WilmsExportActionsProps) {
  return (
    <WilmsExportTrigger
      document={document}
      filenameBase={filenameBase}
      className={cn(className)}
      showIcon={showIcons}
      permissions={permissions}
    />
  );
}
