import type { ReportCategory } from '@/types/reports';

export const REPORT_CATEGORY_LABELS: Record<ReportCategory, string> = {
  collection: 'Collection',
  portfolio: 'Portfolio',
  risk: 'Risk',
  compliance: 'Compliance',
  operations: 'Operations',
};
