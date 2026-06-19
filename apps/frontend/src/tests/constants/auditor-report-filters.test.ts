import { describe, expect, it } from 'vitest';
import {
  AUDITOR_REPORT_CATEGORY_FILTERS,
  matchesAuditorReportCategory,
} from '@/constants/auditor-report-filters';
import type { ReportSummary } from '@/types/services';

function buildReport(partial: Partial<ReportSummary> & Pick<ReportSummary, 'id' | 'title' | 'route' | 'category'>): ReportSummary {
  return {
    description: 'Demo report',
    generatedAt: '2026-06-01T08:00:00.000Z',
    recordCount: 10,
    ...partial,
  };
}

describe('auditor report category filters', () => {
  it('maps operational reports to the operational category', () => {
    const report = buildReport({
      id: 'daily-collection',
      title: 'Daily Collection',
      route: '/reports/daily-collection',
      category: 'operations',
    });

    expect(matchesAuditorReportCategory(report, 'operational')).toBe(true);
    expect(matchesAuditorReportCategory(report, 'portfolio')).toBe(false);
  });

  it('maps financial reports to the financial category', () => {
    const ledger = buildReport({
      id: 'financial-ledger',
      title: 'Financial Ledger',
      route: '/reports/financial-ledger',
      category: 'collection',
    });
    const daily = buildReport({
      id: 'daily-collection',
      title: 'Daily Collection',
      route: '/reports/daily-collection',
      category: 'collection',
    });

    expect(matchesAuditorReportCategory(ledger, 'financial')).toBe(true);
    expect(matchesAuditorReportCategory(daily, 'financial')).toBe(true);
  });

  it('exposes service-driven auditor filter options', () => {
    expect(AUDITOR_REPORT_CATEGORY_FILTERS.map((option) => option.value)).toEqual([
      '',
      'operational',
      'financial',
      'compliance',
      'risk',
      'audit',
      'portfolio',
    ]);
  });
});
