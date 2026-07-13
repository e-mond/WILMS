'use client';

import { useMemo, useState } from 'react';
import { CurrencyAmount, DataTable, KpiCard } from '@/components/data-display';
import { ExecutiveKpiGrid, ManagementToolbar } from '@/components/layout/executive';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { ExportCsvButton } from '@/features/reports/components/ExportCsvButton';
import { WILMS_REPORT_TYPE } from '@/features/export';
import { useFinancialLedgerReport } from '@/features/reports/hooks/useFinancialLedgerReport';
import type { FinancialLedgerReportRow } from '@/types/reports';
import { formatPesewasForCsv } from '@/utils/export-csv';
import { resolveBorrowerDisplayId } from '@/utils/format-borrower-display-id';
import { resolveLoanDisplayId, resolveUserDisplayId } from '@/utils/entity-display-id';

const CSV_HEADERS = ['Type', 'Borrower', 'Loan', 'Amount (GHS)', 'Collector', 'Recorded At'];

export function FinancialLedgerReportPanel() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data, isLoading, isError, error, refetch } = useFinancialLedgerReport({
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  });

  const csvRows = useMemo(
    () =>
      (data?.rows ?? []).map((row) => [
        row.type,
        resolveBorrowerDisplayId({ id: row.borrowerId }),
        row.loanId ? resolveLoanDisplayId({ id: row.loanId }) : '—',
        formatPesewasForCsv(row.amountPesewas),
        resolveUserDisplayId(row.collectorId),
        row.recordedAt,
      ]),
    [data?.rows],
  );

  return (
    <QueryStatePanel
      isLoading={isLoading}
      isError={isError} error={error}
      errorMessage="Unable to generate report. Try again shortly."
      onRetry={() => void refetch()}
      variant="table"
    >
      {data ? (
    <div className="space-y-wilms-4">
      <ExecutiveKpiGrid>
        <KpiCard variant="executive" label="Ledger Entries" value={data.rows.length} />
        <KpiCard
          variant="executive"
          label="Transaction Volume"
          value={
            <CurrencyAmount
              value={data.rows.reduce((total, row) => total + Math.abs(row.amountPesewas), 0)}
              className="whitespace-nowrap tabular-nums"
            />
          }
          valueClassName="text-brand-primary"
        />
      </ExecutiveKpiGrid>

      <ManagementToolbar
        search={
          <div className="grid gap-wilms-3 sm:grid-cols-2">
            <Input
              type="date"
              aria-label="From date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <Input
              type="date"
              aria-label="To date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        }
        actions={
          <ExportCsvButton
            label="Export"
            filename="financial-ledger.csv"
            reportType={WILMS_REPORT_TYPE.FINANCIAL_LEDGER}
            reportTitle="Financial Ledger Report"
            headers={CSV_HEADERS}
            rows={csvRows}
          />
        }
      />

      <DataTable<FinancialLedgerReportRow>
        variant="executive"
        layout="auto"
        caption="Financial ledger"
        data={data.rows}
        getRowId={(row) => row.id}
        columns={[
          {
            id: 'type',
            header: 'Type',
            className: 'whitespace-nowrap',
            cell: (row) => <Badge variant="default">{row.type}</Badge>,
          },
          {
            id: 'borrower',
            header: 'Borrower',
            className: 'whitespace-nowrap font-mono text-small',
            cell: (row) => resolveBorrowerDisplayId({ id: row.borrowerId }),
          },
          {
            id: 'loan',
            header: 'Loan',
            className: 'whitespace-nowrap font-mono text-small',
            cell: (row) => (row.loanId ? resolveLoanDisplayId({ id: row.loanId }) : '—'),
          },
          {
            id: 'amount',
            header: 'Amount',
            className: 'whitespace-nowrap tabular-nums',
            cell: (row) => <CurrencyAmount value={row.amountPesewas} />,
          },
          {
            id: 'collector',
            header: 'Collector',
            className: 'whitespace-nowrap font-mono text-small',
            cell: (row) => resolveUserDisplayId(row.collectorId),
          },
          {
            id: 'recordedAt',
            header: 'Recorded',
            className: 'whitespace-nowrap',
            cell: (row) => row.recordedAt.slice(0, 10),
          },
        ]}
      />
    </div>
      ) : null}
    </QueryStatePanel>
  );
}
