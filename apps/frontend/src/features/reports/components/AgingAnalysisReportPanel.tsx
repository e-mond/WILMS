'use client';

import { useQuery } from '@tanstack/react-query';
import { CurrencyAmount, DataTable, KpiCard } from '@/components/data-display';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { ExecutiveKpiGrid, ManagementToolbar } from '@/components/layout/executive';
import { useQueryLoadingPolicy } from '@/hooks/useQueryLoadingPolicy';
import { ExportCsvButton } from '@/features/reports/components/ExportCsvButton';
import { WILMS_REPORT_TYPE } from '@/features/export';
import { reportService } from '@/services';
import type { AgingAnalysisReport, AgingAnalysisRow } from '@/types/enterprise';
import { formatPesewasForCsv } from '@/utils/export-csv';

const CSV_HEADERS = ['Loan', 'Borrower', 'Outstanding (GHS)', 'Days past due', 'Bucket'];

const BUCKET_LABELS: Record<AgingAnalysisRow['bucket'], string> = {
  current: 'Current',
  days1to7: '1–7 days',
  days8to30: '8–30 days',
  days31plus: '31+ days',
};

export function AgingAnalysisReportPanel() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['reports', 'aging-analysis'] as const,
    queryFn: () => reportService.getAgingAnalysisReport(),
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
      errorMessage="Unable to generate aging analysis. Try again shortly."
      isForbidden={isForbidden}
      onRetry={() => void refetch()}
      variant="table"
    >
      {data ? <AgingAnalysisReportContent data={data} /> : null}
    </QueryStatePanel>
  );
}

function AgingAnalysisReportContent({ data }: { data: AgingAnalysisReport }) {
  const rows = data.rows ?? [];
  const csvRows = rows.map((row) => [
    row.loanId,
    row.borrowerId,
    formatPesewasForCsv(row.outstandingPesewas),
    String(row.daysPastDue),
    BUCKET_LABELS[row.bucket],
  ]);

  return (
    <div className="space-y-wilms-4">
      <ExecutiveKpiGrid>
        <KpiCard variant="executive" label="Current" value={data.summary.current} />
        <KpiCard
          variant="executive"
          label="1–7 days"
          value={data.summary.days1to7}
          valueClassName="text-warning"
        />
        <KpiCard
          variant="executive"
          label="8–30 days"
          value={data.summary.days8to30}
          valueClassName="text-warning"
        />
        <KpiCard
          variant="executive"
          label="31+ days"
          value={data.summary.days31plus}
          valueClassName="text-danger"
        />
      </ExecutiveKpiGrid>

      <ManagementToolbar
        search={<p className="text-small text-text-muted">Active loans by days past due</p>}
        actions={
          <ExportCsvButton
            label="Export"
            filename="WILMS_Aging_Analysis_Report.csv"
            reportType={WILMS_REPORT_TYPE.GENERIC_REPORT}
            reportTitle="Aging Analysis Report"
            headers={CSV_HEADERS}
            rows={csvRows}
          />
        }
      />

      <DataTable<AgingAnalysisRow>
        variant="executive"
        caption="Aging analysis"
        data={rows}
        getRowId={(row) => row.loanId}
        columns={[
          { id: 'loan', header: 'Loan', cell: (row) => row.loanId },
          { id: 'borrower', header: 'Borrower', cell: (row) => row.borrowerId },
          {
            id: 'outstanding',
            header: 'Outstanding',
            cell: (row) => <CurrencyAmount value={row.outstandingPesewas} />,
          },
          { id: 'days', header: 'Days past due', cell: (row) => row.daysPastDue },
          {
            id: 'bucket',
            header: 'Bucket',
            cell: (row) => BUCKET_LABELS[row.bucket],
          },
        ]}
      />
    </div>
  );
}
