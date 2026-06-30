'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  CurrencyAmount,
  DataTable,
  KpiCard,
  LoanStatusBadge,
} from '@/components/data-display';
import {
  ExecutiveKpiGrid,
  FilterPillBar,
  ManagementToolbar,
} from '@/components/layout/executive';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ExportCsvButton } from '@/features/reports/components/ExportCsvButton';
import { WILMS_REPORT_TYPE } from '@/features/export';
import { useLoanPortfolioReport } from '@/features/reports/hooks/useLoanPortfolioReport';
import { LOAN_CYCLE_BATCH_OPTIONS } from '@/constants/loan';
import { LOAN_STATUS_FILTER_OPTIONS } from '@/constants/loan-status';
import type { LoanPortfolioEntry } from '@/types/loan';
import { formatDisplayDate } from '@/utils/format-date';
import { formatPesewasForCsv } from '@/utils/export-csv';

const STATUS_FILTERS = LOAN_STATUS_FILTER_OPTIONS.map((option) => ({
  value: option.value,
  label: option.value ? option.label : 'All',
}));

const CYCLE_FILTER_OPTIONS = [
  { value: '', label: 'All cycles' },
  ...LOAN_CYCLE_BATCH_OPTIONS.map((cycle) => ({ value: cycle, label: cycle })),
  { value: 'Cycle 4 — October 2025', label: 'Cycle 4 — October 2025' },
];

const CSV_HEADERS = [
  'Borrower',
  'Community',
  'Group',
  'Loan Amount (GHS)',
  'Outstanding (GHS)',
  'Weekly (GHS)',
  'Status',
  'Cycle',
  'Payment Day',
  'Start Date',
];

export function LoanPortfolioReportPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cycleBatchFilter, setCycleBatchFilter] = useState('');

  const { data, isLoading, isError, refetch } = useLoanPortfolioReport({
    search: searchQuery,
    status: statusFilter,
    cycleBatch: cycleBatchFilter,
  });

  const csvRows = useMemo(
    () =>
      (data?.entries ?? []).map((entry) => [
        entry.borrowerName,
        entry.community,
        entry.groupName,
        formatPesewasForCsv(entry.amountPesewas),
        formatPesewasForCsv(entry.outstandingPesewas),
        formatPesewasForCsv(entry.weeklyPaymentPesewas),
        entry.status,
        entry.cycleBatch,
        entry.paymentDay,
        entry.startDate,
      ]),
    [data?.entries],
  );

  return (
    <QueryStatePanel
      isLoading={isLoading}
      isError={isError || !data}
      errorMessage="Unable to generate the loan portfolio report. Check your connection and try again."
      onRetry={() => void refetch()}
      isEmpty={Boolean(data && data.entries.length === 0)}
      emptyTitle="No loans match this report"
      emptyDescription="Adjust filters or create loans before exporting the portfolio report."
    >
      {data ? (
    <div className="space-y-wilms-4">
      <ExecutiveKpiGrid>
        <KpiCard variant="executive" label="Loans in Report" value={data.summary.totalLoans} />
        <KpiCard
          variant="executive"
          label="Active Loans"
          value={data.summary.activeLoans}
          valueClassName="text-status-active"
        />
        <KpiCard
          variant="executive"
          label="Total Disbursed"
          value={<CurrencyAmount value={data.summary.totalDisbursedPesewas} />}
          valueClassName="text-brand-primary"
        />
        <KpiCard
          variant="executive"
          label="Total Outstanding"
          value={<CurrencyAmount value={data.summary.totalOutstandingPesewas} />}
          valueClassName="text-danger"
        />
      </ExecutiveKpiGrid>

      <ManagementToolbar
        search={
          <Input
            aria-label="Search loan portfolio report"
            placeholder="Search by borrower, community, group, or loan ID"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        }
        filters={
          <div className="flex flex-wrap items-center gap-wilms-3">
            <FilterPillBar
              ariaLabel="Filter report by loan status"
              options={STATUS_FILTERS}
              value={statusFilter}
              onChange={setStatusFilter}
            />
            <Select
              aria-label="Filter by cycle or batch"
              value={cycleBatchFilter}
              onChange={(event) => setCycleBatchFilter(event.target.value)}
              className="min-w-[180px]"
            >
              {CYCLE_FILTER_OPTIONS.map((option) => (
                <option key={option.value || 'all-cycles'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        }
        actions={
          <ExportCsvButton
            label="Export"
            filename={`loan-portfolio-${data.generatedAt.slice(0, 10)}.csv`}
            reportType={WILMS_REPORT_TYPE.LOAN_PORTFOLIO}
            reportTitle="Loan Portfolio Report"
            headers={CSV_HEADERS}
            rows={csvRows}
          />
        }
      />

      <p className="text-small text-text-muted">
        Generated {formatDisplayDate(data.generatedAt.slice(0, 10))} · {data.entries.length} loans
      </p>

      <DataTable<LoanPortfolioEntry>
        variant="executive"
        caption="Loan portfolio report"
        data={data.entries}
        getRowId={(row) => row.id}
        columns={[
          {
            id: 'borrower',
            header: 'Borrower',
            cell: (row) => (
              <div>
                <p className="font-semibold text-text-primary">{row.borrowerName}</p>
                <p className="text-small text-text-muted">{row.community}</p>
              </div>
            ),
          },
          { id: 'group', header: 'Group', cell: (row) => row.groupName },
          {
            id: 'amount',
            header: 'Loan amount',
            cell: (row) => <CurrencyAmount value={row.amountPesewas} />,
          },
          {
            id: 'outstanding',
            header: 'Outstanding',
            cell: (row) => <CurrencyAmount value={row.outstandingPesewas} />,
          },
          {
            id: 'weekly',
            header: 'Weekly',
            cell: (row) => <CurrencyAmount value={row.weeklyPaymentPesewas} />,
          },
          {
            id: 'status',
            header: 'Status',
            cell: (row) => <LoanStatusBadge status={row.status} />,
          },
          { id: 'cycle', header: 'Cycle', cell: (row) => row.cycleBatch },
          { id: 'paymentDay', header: 'Payment day', cell: (row) => row.paymentDay },
          {
            id: 'action',
            header: 'Action',
            cell: (row) => (
              <Link
                href={`/loans/${row.id}`}
                className="text-small font-semibold text-brand-primary hover:underline"
              >
                View loan
              </Link>
            ),
          },
        ]}
      />
    </div>
      ) : null}
    </QueryStatePanel>
  );
}
