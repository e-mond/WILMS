'use client';

import { useMemo, useState } from 'react';
import { CurrencyAmount, DataTable, KpiCard } from '@/components/data-display';
import { ExecutiveKpiGrid, ManagementToolbar } from '@/components/layout/executive';
import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { ExportCsvButton } from '@/features/reports/components/ExportCsvButton';
import { WILMS_REPORT_TYPE } from '@/features/export';
import { useFinancialLedgerReport } from '@/features/reports/hooks/useFinancialLedgerReport';
import type { FinancialLedgerReportRow } from '@/types/reports';
import { formatPesewasForCsv } from '@/utils/export-csv';

const CSV_HEADERS = ['Type', 'Borrower', 'Loan', 'Amount (GHS)', 'Collector', 'Recorded At'];

export function FinancialLedgerReportPanel() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data, isLoading, isError } = useFinancialLedgerReport({
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  });

  const csvRows = useMemo(
    () =>
      (data?.rows ?? []).map((row) => [
        row.type,
        row.borrowerId,
        row.loanId ?? '—',
        formatPesewasForCsv(row.amountPesewas),
        row.collectorId,
        row.recordedAt,
      ]),
    [data?.rows],
  );

  if (isLoading) {
    return <LoadingSpinner label="Generating financial ledger" className="py-wilms-8" />;
  }

  if (isError || !data) {
    return <EmptyState title="Unable to generate report" description="Try again shortly." />;
  }

  return (
    <div className="space-y-wilms-4">
      <ExecutiveKpiGrid>
        <KpiCard variant="executive" label="Ledger Entries" value={data.rows.length} />
        <KpiCard
          variant="executive"
          label="Transaction Volume"
          value={
            <CurrencyAmount
              value={data.rows.reduce((total, row) => total + Math.abs(row.amountPesewas), 0)}
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
        caption="Financial ledger"
        data={data.rows}
        getRowId={(row) => row.id}
        columns={[
          {
            id: 'type',
            header: 'Type',
            cell: (row) => <Badge variant="default">{row.type}</Badge>,
          },
          { id: 'borrower', header: 'Borrower', cell: (row) => row.borrowerId },
          { id: 'loan', header: 'Loan', cell: (row) => row.loanId ?? '—' },
          {
            id: 'amount',
            header: 'Amount',
            cell: (row) => <CurrencyAmount value={row.amountPesewas} />,
          },
          { id: 'recordedAt', header: 'Recorded', cell: (row) => row.recordedAt.slice(0, 10) },
        ]}
      />
    </div>
  );
}
