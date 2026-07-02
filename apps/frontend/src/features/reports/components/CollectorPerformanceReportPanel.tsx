'use client';

import { CurrencyAmount, DataTable } from '@/components/data-display';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { ManagementToolbar } from '@/components/layout/executive';
import { useQueryLoadingPolicy } from '@/hooks/useQueryLoadingPolicy';
import { ExportCsvButton } from '@/features/reports/components/ExportCsvButton';
import { WILMS_REPORT_TYPE } from '@/features/export';
import { useCollectorPerformanceReport } from '@/features/reports/hooks/useCollectorPerformanceReport';
import type { CollectorPerformanceReportRow } from '@/types/reports';
import { formatPesewasForCsv } from '@/utils/export-csv';

const CSV_HEADERS = ['Collector', 'Expected (GHS)', 'Collected (GHS)', 'Rate %', 'Missed Borrowers', 'Variance (GHS)'];

export function CollectorPerformanceReportPanel() {
  const { data, isLoading, isError, error, refetch } = useCollectorPerformanceReport();
  const { showLoading, isTimedOut, isForbidden } = useQueryLoadingPolicy({ isLoading, isError, error });

  return (
    <QueryStatePanel
      isLoading={isLoading}
      showLoading={showLoading}
      isTimedOut={isTimedOut}
      isError={isError} error={error}
      errorMessage="Unable to generate report. Try again shortly."
      isForbidden={isForbidden}
      onRetry={() => void refetch()}
      variant="table"
    >
      {data ? (
        <CollectorPerformanceReportContent data={data} />
      ) : null}
    </QueryStatePanel>
  );
}

function CollectorPerformanceReportContent({
  data,
}: {
  data: NonNullable<ReturnType<typeof useCollectorPerformanceReport>['data']>;
}) {
  const rows = data.rows ?? [];
  const csvRows = rows.map((row) => [
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
        search={<p className="text-small text-text-muted">{rows.length} collectors in report</p>}
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
        data={rows}
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
