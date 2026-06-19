import type { ReportSummary } from '@/types/services';

export const AUDITOR_REPORT_CATEGORY_FILTERS = [
  { value: '', label: 'All' },
  { value: 'operational', label: 'Operational' },
  { value: 'financial', label: 'Financial' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'risk', label: 'Risk' },
  { value: 'audit', label: 'Audit' },
  { value: 'portfolio', label: 'Portfolio' },
] as const;

export type AuditorReportCategoryFilter =
  (typeof AUDITOR_REPORT_CATEGORY_FILTERS)[number]['value'];

export function matchesAuditorReportCategory(
  report: ReportSummary,
  filter: AuditorReportCategoryFilter,
): boolean {
  if (!filter) {
    return true;
  }

  switch (filter) {
    case 'operational':
      return report.category === 'operations';
    case 'financial':
      return (
        report.category === 'collection' ||
        report.route.includes('financial-ledger') ||
        report.route.includes('daily-collection')
      );
    case 'compliance':
      return report.category === 'compliance';
    case 'risk':
      return report.category === 'risk';
    case 'audit':
      return report.route.includes('audit-log') || report.title.toLowerCase().includes('audit');
    case 'portfolio':
      return report.category === 'portfolio';
    default:
      return true;
  }
}
