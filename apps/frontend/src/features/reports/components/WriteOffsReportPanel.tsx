'use client';

import { useQuery } from '@tanstack/react-query';
import { CurrencyAmount, DataTable, KpiCard } from '@/components/data-display';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { ExecutiveKpiGrid, ManagementToolbar } from '@/components/layout/executive';
import { useQueryLoadingPolicy } from '@/hooks/useQueryLoadingPolicy';
import { ExportCsvButton } from '@/features/reports/components/ExportCsvButton';
import { WILMS_REPORT_TYPE } from '@/features/export';
import { reportService } from '@/services';
import type { WriteOffReport, WriteOffReportRow } from '@/types/enterprise';
import { formatPesewasForCsv } from '@/utils/export-csv';
import { formatDisplayDate } from '@/utils/format-date';

const CSV_HEADERS = ['ID', 'Loan', 'Borrower', 'Amount (GHS)', 'Status', 'Reason', 'Created'];

export function WriteOffsReportPanel() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['reports', 'write-offs'] as const,
    queryFn: () => reportService.getWriteOffsReport(),
  });
  const { showLoading, isTimedOut, isForbidden } = useQueryLoadingPolicy({
    isLoading,
    isError,
    error,
  });

  return (
    <QueryStatePanel
      isLoading={isLoading}
      showLoading={showLoading}
      isTimedOut={isTimedOut}
      isError={isError}
      error={error}
      errorMessage="Unable to generate write-offs report. Try again shortly."
      isForbidden={isForbidden}
      onRetry={() => void refetch()}
      variant="table"
    >
      {data ? <WriteOffsReportContent data={data} /> : null}
    </QueryStatePanel>
  );
}

function WriteOffsReportContent({ data }: { data: WriteOffReport }) {
  const rows = data.rows ?? [];
  const csvRows = rows.map((row) => [
    row.id,
    row.loanId ?? '—',
    row.borrowerId ?? '—',
    formatPesewasForCsv(row.amountPesewas),
    row.status,
    row.reason ?? '—',
    row.createdAt.slice(0, 10),
  ]);

  return (
    <div className="space-y-wilms-4">
      <ExecutiveKpiGrid>
        <KpiCard variant="executive" label="Total write-offs" value={data.summary.totalWriteOffs} />
        <KpiCard
          variant="executive"
          label="Approved"
          value={data.summary.approvedCount}
          valueClassName="text-status-active"
        />
        <KpiCard
          variant="executive"
          label="Pending"
          value={data.summary.pendingCount}
          valueClassName="text-brand-primary"
        />
        <KpiCard
          variant="executive"
          label="Written off"
          value={<CurrencyAmount value={data.summary.totalWrittenOffPesewas} />}
          valueClassName="text-danger"
        />
      </ExecutiveKpiGrid>

      <ManagementToolbar
        search={<p className="text-small text-text-muted">Approved and pending write-off adjustments</p>}
        actions={
          <ExportCsvButton
            label="Export"
            filename="write-offs-report.csv"
            reportType={WILMS_REPORT_TYPE.GENERIC_REPORT}
            reportTitle="Write-offs Report"
            headers={CSV_HEADERS}
            rows={csvRows}
          />
        }
      />

      <DataTable<WriteOffReportRow>
        variant="executive"
        caption="Write-offs report"
        data={rows}
        getRowId={(row) => row.id}
        columns={[
          { id: 'id', header: 'ID', cell: (row) => row.id },
          { id: 'loan', header: 'Loan', cell: (row) => row.loanId ?? '—' },
          { id: 'borrower', header: 'Borrower', cell: (row) => row.borrowerId ?? '—' },
          {
            id: 'amount',
            header: 'Amount',
            cell: (row) => <CurrencyAmount value={row.amountPesewas} />,
          },
          { id: 'status', header: 'Status', cell: (row) => row.status },
          {
            id: 'created',
            header: 'Created',
            cell: (row) => formatDisplayDate(row.createdAt.slice(0, 10)),
          },
        ]}
      />
    </div>
  );
}
