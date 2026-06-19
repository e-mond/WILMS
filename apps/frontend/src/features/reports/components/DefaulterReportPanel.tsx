'use client';

import { CurrencyAmount, DataTable, KpiCard } from '@/components/data-display';
import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { ExecutiveKpiGrid, ManagementToolbar } from '@/components/layout/executive';
import { ExportCsvButton } from '@/features/reports/components/ExportCsvButton';
import { WILMS_REPORT_TYPE } from '@/features/export';
import { useDefaulterReport } from '@/features/reports/hooks/useDefaulterReport';
import type { DefaulterReportRow } from '@/types/reports';
import { formatPesewasForCsv } from '@/utils/export-csv';

const CSV_HEADERS = ['Borrower', 'Community', 'Group', 'Missed Weeks', 'Outstanding (GHS)', 'Last Payment'];

export function DefaulterReportPanel() {
  const { data, isLoading, isError } = useDefaulterReport();

  if (isLoading) {
    return <LoadingSpinner label="Generating defaulter report" className="py-wilms-8" />;
  }

  if (isError || !data) {
    return <EmptyState title="Unable to generate report" description="Try again shortly." />;
  }

  const csvRows = data.rows.map((row) => [
    row.borrowerName,
    row.community,
    row.groupName,
    String(row.missedWeeks),
    formatPesewasForCsv(row.outstandingPesewas),
    row.lastPaymentDate ?? '—',
  ]);

  return (
    <div className="space-y-wilms-4">
      <ExecutiveKpiGrid>
        <KpiCard
          variant="executive"
          label="Defaulters"
          value={data.summary.totalDefaulters}
          valueClassName="text-danger"
        />
        <KpiCard
          variant="executive"
          label="Outstanding"
          value={<CurrencyAmount value={data.summary.totalOutstandingPesewas} />}
          valueClassName="text-danger"
        />
      </ExecutiveKpiGrid>

      <ManagementToolbar
        search={<p className="text-small text-text-muted">Borrowers with consecutive missed payments</p>}
        actions={
          <ExportCsvButton
            label="Export"
            filename="defaulter-report.csv"
            reportType={WILMS_REPORT_TYPE.DEFAULTER}
            reportTitle="Defaulter Report"
            headers={CSV_HEADERS}
            rows={csvRows}
          />
        }
      />

      <DataTable<DefaulterReportRow>
        variant="executive"
        caption="Defaulter report"
        data={data.rows}
        getRowId={(row) => row.id}
        columns={[
          { id: 'borrower', header: 'Borrower', cell: (row) => row.borrowerName },
          { id: 'community', header: 'Community', cell: (row) => row.community },
          { id: 'group', header: 'Group', cell: (row) => row.groupName },
          { id: 'missed', header: 'Missed weeks', cell: (row) => row.missedWeeks },
          {
            id: 'outstanding',
            header: 'Outstanding',
            cell: (row) => (
              <CurrencyAmount value={row.outstandingPesewas} className="text-danger" />
            ),
          },
        ]}
      />
    </div>
  );
}
