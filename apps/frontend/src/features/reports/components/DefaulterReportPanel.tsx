'use client';

import Link from 'next/link';
import { CurrencyAmount, DataTable, KpiCard } from '@/components/data-display';
import { EmptyState } from '@/components/feedback/EmptyState';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { ExecutiveKpiGrid, ManagementToolbar } from '@/components/layout/executive';
import { useQueryLoadingPolicy } from '@/hooks/useQueryLoadingPolicy';
import { ExportCsvButton } from '@/features/reports/components/ExportCsvButton';
import { WILMS_REPORT_TYPE } from '@/features/export';
import { useDefaulterReport } from '@/features/reports/hooks/useDefaulterReport';
import type { DefaulterReportRow } from '@/types/reports';
import { formatPesewasForCsv } from '@/utils/export-csv';

const CSV_HEADERS = ['Borrower', 'Community', 'Group', 'Missed Weeks', 'Outstanding (GHS)', 'Last Payment'];

export function DefaulterReportPanel() {
  const { data, isLoading, isError, error, refetch } = useDefaulterReport();
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
      {data ? <DefaulterReportContent data={data} /> : null}
    </QueryStatePanel>
  );
}

function DefaulterReportContent({ data }: { data: NonNullable<ReturnType<typeof useDefaulterReport>['data']> }) {
  const rows = data.rows ?? [];
  const csvRows = rows.map((row) => [
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
        search={
          <p className="text-small text-text-muted">
            Loans with status DEFAULTED. Active loans with missed weeks appear in the{' '}
            <Link href="/reports/missed-payments" className="text-brand-primary underline">
              Missed Payments Report
            </Link>
            .
          </p>
        }
        actions={
          <ExportCsvButton
            label="Export"
            filename="WILMS_Defaulter_Report.csv"
            reportType={WILMS_REPORT_TYPE.DEFAULTER}
            reportTitle="Defaulter Report"
            headers={CSV_HEADERS}
            rows={csvRows}
          />
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No defaulted loans"
          description="This report lists loans with DEFAULTED status. Active loans with missed weeks are listed in the Missed Payments Report."
          action={
            <Link href="/reports/missed-payments" className="text-brand-primary underline">
              Open Missed Payments Report
            </Link>
          }
        />
      ) : (
        <DataTable<DefaulterReportRow>
        variant="executive"
        caption="Defaulter report"
        data={rows}
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
      )}
    </div>
  );
}
