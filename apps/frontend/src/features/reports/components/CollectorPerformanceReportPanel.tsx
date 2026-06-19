'use client';

import { CurrencyAmount, DataTable } from '@/components/data-display';
import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { ManagementToolbar } from '@/components/layout/executive';
import { ExportCsvButton } from '@/features/reports/components/ExportCsvButton';
import { WILMS_REPORT_TYPE } from '@/features/export';
import { useCollectorPerformanceReport } from '@/features/reports/hooks/useCollectorPerformanceReport';
import type { CollectorPerformanceReportRow } from '@/types/reports';
import { formatPesewasForCsv } from '@/utils/export-csv';

const CSV_HEADERS = ['Collector', 'Expected (GHS)', 'Collected (GHS)', 'Rate %', 'Missed Borrowers', 'Variance (GHS)'];

export function CollectorPerformanceReportPanel() {
  const { data, isLoading, isError } = useCollectorPerformanceReport();

  if (isLoading) {
    return <LoadingSpinner label="Generating collector performance report" className="py-wilms-8" />;
  }

  if (isError || !data) {
    return <EmptyState title="Unable to generate report" description="Try again shortly." />;
  }

  const csvRows = data.rows.map((row) => [
    row.collectorName,
    formatPesewasForCsv(row.expectedPesewas),
    formatPesewasForCsv(row.collectedPesewas),
    String(row.collectionRatePercent),
    String(row.missedBorrowers),
    formatPesewasForCsv(row.reconciliationVariancePesewas),
  ]);

  return (
    <div className="space-y-wilms-4">
      <ManagementToolbar
        search={<p className="text-small text-text-muted">{data.rows.length} collectors in report</p>}
        actions={
          <ExportCsvButton
            label="Export"
            filename="collector-performance.csv"
            reportType={WILMS_REPORT_TYPE.COLLECTOR_PERFORMANCE}
            reportTitle="Collector Performance Report"
            headers={CSV_HEADERS}
            rows={csvRows}
          />
        }
      />

      <DataTable<CollectorPerformanceReportRow>
        variant="executive"
        caption="Collector performance report"
        data={data.rows}
        getRowId={(row) => row.collectorId}
        columns={[
          { id: 'name', header: 'Collector', cell: (row) => row.collectorName },
          {
            id: 'expected',
            header: 'Expected',
            cell: (row) => <CurrencyAmount value={row.expectedPesewas} />,
          },
          {
            id: 'collected',
            header: 'Collected',
            cell: (row) => (
              <CurrencyAmount value={row.collectedPesewas} className="text-status-active" />
            ),
          },
          {
            id: 'rate',
            header: 'Rate',
            cell: (row) => (
              <span
                className={
                  row.collectionRatePercent >= 90
                    ? 'font-semibold text-status-active'
                    : row.collectionRatePercent >= 70
                      ? 'font-semibold text-brand-primary'
                      : 'font-semibold text-danger'
                }
              >
                {row.collectionRatePercent}%
              </span>
            ),
          },
          { id: 'missed', header: 'Missed borrowers', cell: (row) => row.missedBorrowers },
        ]}
      />
    </div>
  );
}
