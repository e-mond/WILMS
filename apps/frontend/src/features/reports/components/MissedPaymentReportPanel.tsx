'use client';

import Link from 'next/link';
import { CurrencyAmount, DataTable, KpiCard } from '@/components/data-display';
import { EmptyState } from '@/components/feedback/EmptyState';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { ExecutiveKpiGrid, ManagementToolbar } from '@/components/layout/executive';
import { useQueryLoadingPolicy } from '@/hooks/useQueryLoadingPolicy';
import { ExportCsvButton } from '@/features/reports/components/ExportCsvButton';
import { WILMS_REPORT_TYPE } from '@/features/export';
import { useMissedPaymentReport } from '@/features/reports/hooks/useMissedPaymentReport';
import type { MissedPaymentReportRow } from '@/types/reports';
import { formatPesewasForCsv } from '@/utils/export-csv';

const CSV_HEADERS = ['Borrower', 'Community', 'Group', 'Missed Weeks', 'Outstanding (GHS)', 'Last Payment'];

export function MissedPaymentReportPanel() {
  const { data, isLoading, isError, error, refetch } = useMissedPaymentReport();
  const { showLoading, isTimedOut, isForbidden } = useQueryLoadingPolicy({ isLoading, isError, error });

  return (
    <QueryStatePanel
      isLoading={isLoading}
      showLoading={showLoading}
      isTimedOut={isTimedOut}
      isError={isError}
      error={error}
      errorMessage="Unable to generate report. Try again shortly."
      isForbidden={isForbidden}
      onRetry={() => void refetch()}
      variant="table"
    >
      {data ? <MissedPaymentReportContent data={data} /> : null}
    </QueryStatePanel>
  );
}

function MissedPaymentReportContent({
  data,
}: {
  data: NonNullable<ReturnType<typeof useMissedPaymentReport>['data']>;
}) {
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
          label="Missed payments"
          value={data.summary.totalMissedBorrowers}
          valueClassName="text-status-at-risk"
        />
        <KpiCard
          variant="executive"
          label="Outstanding"
          value={<CurrencyAmount value={data.summary.totalOutstandingPesewas} />}
          valueClassName="text-status-at-risk"
        />
      </ExecutiveKpiGrid>

      <ManagementToolbar
        search={
          <p className="text-small text-text-muted">
            Active loans with one or more missed schedule weeks. Formal defaults appear in the{' '}
            <Link href="/reports/defaulters" className="text-brand-primary underline">
              Defaulter Report
            </Link>
            .
          </p>
        }
        actions={
          <ExportCsvButton
            label="Export"
            filename="WILMS_Missed_Payments_Report.csv"
            reportType={WILMS_REPORT_TYPE.DEFAULTER}
            reportTitle="Missed Payments Report"
            headers={CSV_HEADERS}
            rows={csvRows}
          />
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No missed payments on active loans"
          description="When borrowers miss scheduled weeks, they will appear here. Alerts from the dashboard link to this report."
        />
      ) : (
        <DataTable<MissedPaymentReportRow>
          variant="executive"
          caption="Missed payments report"
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
                <CurrencyAmount value={row.outstandingPesewas} className="text-status-at-risk" />
              ),
            },
            {
              id: 'records',
              header: 'Record',
              cell: (row) => (
                <Link href={`/records/${row.borrowerId}`} className="text-brand-primary underline">
                  View file
                </Link>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
