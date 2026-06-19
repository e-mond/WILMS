import { WILMS_REPORT_TYPE_PREFIX } from '@/features/export/constants/branding';
import type { WilmsReportType } from '@/features/export/types';

let reportSequence = 0;

export function resetReportIdSequence(): void {
  reportSequence = 0;
}

export function generateReportId(reportType: WilmsReportType, date = new Date()): string {
  reportSequence = (reportSequence + 1) % 1_000_000;
  const prefix = WILMS_REPORT_TYPE_PREFIX[reportType] ?? 'RPT';
  const year = date.getFullYear();
  const sequence = String(reportSequence).padStart(6, '0');

  return `WILMS-${prefix}-${year}-${sequence}`;
}
