import { WILMS_REPORT_TYPE, type WilmsExportDocument } from '@/features/export/types';
import { generateReportId } from '@/features/export/utils/report-id';
import { getWilmsEnvironment } from '@/features/export/utils/environment';
import { formatExportTimestamp, formatPesewasForExport } from '@/features/export/utils/formatters';
import type { DashboardSummary } from '@/types/dashboard';

export interface DashboardExportInput {
  summary: DashboardSummary;
  generatedBy: string;
}

export function buildDashboardExportDocument(input: DashboardExportInput): WilmsExportDocument {
  const reportId = generateReportId(WILMS_REPORT_TYPE.GENERIC_REPORT);
  const generatedAt = formatExportTimestamp();

  return {
    metadata: {
      reportType: WILMS_REPORT_TYPE.GENERIC_REPORT,
      reportTitle: 'Executive Dashboard Summary',
      reportId,
      generatedAt,
      generatedBy: input.generatedBy,
      environment: getWilmsEnvironment(),
      referencePrefix: 'DSH',
    },
    executiveSummary: `Dashboard snapshot generated ${generatedAt}.`,
    sections: [
      {
        title: 'Key metrics',
        type: 'metrics',
        metrics: input.summary.kpis.map((kpi) => ({
          label: kpi.label,
          value:
            kpi.valueKind === 'count'
              ? String(kpi.amountPesewas)
              : formatPesewasForExport(kpi.amountPesewas),
        })),
      },
      {
        title: 'Borrower segments',
        type: 'table',
        table: {
          headers: ['Segment', 'Count'],
          rows: input.summary.borrowerSegments.map((segment) => [segment.label, String(segment.count)]),
        },
      },
      {
        title: 'Collector performance',
        type: 'table',
        table: {
          headers: ['Collector', 'Collected', 'Outstanding', 'Rate'],
          rows: input.summary.collectorPerformance.map((row) => [
            row.name,
            formatPesewasForExport(row.actualPesewas),
            formatPesewasForExport(row.variancePesewas),
            `${row.collectionRatePercent}%`,
          ]),
        },
      },
      {
        title: 'Recent alerts',
        type: 'table',
        table: {
          headers: ['Severity', 'Message', 'When'],
          rows: input.summary.recentAlerts.map((alert) => [
            alert.severity,
            alert.message,
            alert.createdAt,
          ]),
        },
      },
    ],
  };
}
