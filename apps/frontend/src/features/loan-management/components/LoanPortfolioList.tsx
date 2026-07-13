'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  CurrencyAmount,
  DataTable,
  KpiCard,
  LoanStatusBadge,
} from '@/components/data-display';
import { EmptyState } from '@/components/feedback/EmptyState';
import { GuidedEmptyState } from '@/components/feedback/GuidedEmptyState';
import { QueryErrorState } from '@/components/feedback/QueryErrorState';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { EMPTY_STATE_COPY } from '@/constants/empty-state-copy';
import {
  ExecutiveKpiGrid,
  ManagementToolbar,
} from '@/components/layout/executive';
import { useQueryLoadingPolicy } from '@/hooks/useQueryLoadingPolicy';
import { ExportCsvButton } from '@/features/reports/components/ExportCsvButton';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { PERMISSION } from '@/constants/permissions';
import { WILMS_REPORT_TYPE } from '@/features/export';
import { DisbursementsAsidePanel } from '@/features/loan-management/components/DisbursementsAsidePanel';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { LOAN_STATUS_FILTER_OPTIONS } from '@/constants/loan-status';
import { useLoanPortfolio } from '@/features/loan-management/hooks/useLoanPortfolio';
import { useShellAsideContent } from '@/hooks/useShellAsideContent';
import { buildCycleBatchFilterOptions } from '@/utils/cycle-batch-options';
import {
  filterPortfolioEntries,
  summarizePortfolioEntries,
} from '@/utils/portfolio';
import type { LoanPortfolioEntry } from '@/types/loan';
import { formatPesewasForCsv } from '@/utils/export-csv';
import { resolveLoanDisplayId } from '@/utils/entity-display-id';

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...LOAN_STATUS_FILTER_OPTIONS.filter((option) => option.value !== '').map((option) => ({
    value: option.value,
    label: option.label,
  })),
];

export function LoanPortfolioList() {
  const { data, isLoading, isError, error, refetch } = useLoanPortfolio();
  const { showLoading, isTimedOut } = useQueryLoadingPolicy({ isLoading });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cycleBatchFilter, setCycleBatchFilter] = useState('');

  const cycleFilterOptions = useMemo(
    () => buildCycleBatchFilterOptions(data ?? []),
    [data],
  );

  const filteredEntries = useMemo(
    () =>
      filterPortfolioEntries(data ?? [], {
        searchQuery,
        statusFilter,
        cycleBatchFilter,
      }),
    [data, searchQuery, statusFilter, cycleBatchFilter],
  );

  const summary = useMemo(
    () => summarizePortfolioEntries(filteredEntries),
    [filteredEntries],
  );

  const portfolioSummary = useMemo(
    () => summarizePortfolioEntries(data ?? []),
    [data],
  );

  const asideContent = useMemo(
    () => (
      <DisbursementsAsidePanel
        totalLoans={portfolioSummary.totalLoans}
        activeLoans={portfolioSummary.activeLoans}
        totalDisbursedPesewas={portfolioSummary.totalDisbursedPesewas}
        totalOutstandingPesewas={portfolioSummary.totalOutstandingPesewas}
      />
    ),
    [portfolioSummary],
  );

  useShellAsideContent(asideContent);

  if (isTimedOut && isLoading) {
    return (
      <QueryStatePanel
        isLoading
        isTimedOut
        isError={false}
        onRetry={() => void refetch()}
        variant="inline"
      >
        {null}
      </QueryStatePanel>
    );
  }

  if (showLoading && isLoading) {
    return (
      <QueryStatePanel isLoading showLoading isError={false} variant="inline">
        {null}
      </QueryStatePanel>
    );
  }

  if (isError) {
    return (
      <QueryErrorState
        error={error}
        onRetry={() => void refetch()}
        title="Unable to load loan portfolio"
      />
    );
  }

  if (!data?.length) {
    return <GuidedEmptyState {...EMPTY_STATE_COPY.loans} />;
  }

  const csvRows = filteredEntries.map((entry) => [
    resolveLoanDisplayId(entry),
    entry.borrowerName,
    entry.community,
    entry.groupName,
    formatPesewasForCsv(entry.amountPesewas),
    formatPesewasForCsv(entry.outstandingPesewas),
    entry.status,
    entry.cycleBatch,
  ]);

  return (
    <div className="space-y-wilms-4">
      <ExecutiveKpiGrid>
        <KpiCard variant="executive" label="Loans Shown" value={summary.totalLoans} />
        <KpiCard
          variant="executive"
          label="Active Loans"
          value={summary.activeLoans}
          valueClassName="text-status-active"
        />
        <KpiCard
          variant="executive"
          label="Total Disbursed"
          value={<CurrencyAmount value={summary.totalDisbursedPesewas} />}
          valueClassName="text-brand-primary"
        />
        <KpiCard
          variant="executive"
          label="Total Outstanding"
          value={<CurrencyAmount value={summary.totalOutstandingPesewas} />}
          valueClassName="text-danger"
        />
      </ExecutiveKpiGrid>

      <ManagementToolbar
        search={
          <Input
            aria-label="Search loan portfolio"
            placeholder="Search by borrower, community, group, or loan ID"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        }
        filters={
          <div className="flex flex-wrap gap-wilms-2">
            <Select
              aria-label="Filter by cycle or batch"
              value={cycleBatchFilter}
              onChange={(event) => setCycleBatchFilter(event.target.value)}
              className="h-10 min-w-[11rem] rounded-sm border border-border bg-card px-wilms-3 text-small"
            >
              {cycleFilterOptions.map((option) => (
                <option key={option.value || 'all-cycles'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Filter by loan status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-10 min-w-[11rem] rounded-sm border border-border bg-card px-wilms-3 text-small"
            >
              {STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value || 'all-statuses'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        }
        actions={
          <>
            <ExportCsvButton
              label="Export"
              filename="loan-portfolio.csv"
              reportType={WILMS_REPORT_TYPE.LOAN_PORTFOLIO}
              reportTitle="Loan Portfolio Export"
              headers={[
                'Loan ID',
                'Borrower',
                'Community',
                'Group',
                'Amount',
                'Outstanding',
                'Status',
                'Cycle',
              ]}
              rows={csvRows}
            />
            <PermissionGate permission={PERMISSION.APPROVE_LOANS}>
              <Link
                href="/loans/new"
                className="inline-flex h-10 items-center justify-center rounded-sm border border-brand-primary bg-brand-primary px-wilms-4 text-body font-semibold text-card hover:opacity-90"
              >
                Create loan
              </Link>
            </PermissionGate>
          </>
        }
      />

      {filteredEntries.length === 0 ? (
        <EmptyState
          title="No loans match your filters"
          description="Try a different status, cycle, or search term."
        />
      ) : (
        <>
          <DataTable<LoanPortfolioEntry>
            variant="executive"
            layout="auto"
            caption="Loan portfolio"
            data={filteredEntries}
            emptyMessage="No loans match your filters."
            getRowId={(row) => row.id}
            columns={[
              {
                id: 'loanId',
                header: 'Loan ID',
                className: 'whitespace-nowrap font-mono text-small tabular-nums',
                cell: (row) => (
                  <span className="font-semibold text-brand-primary">{resolveLoanDisplayId(row)}</span>
                ),
              },
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
                className: 'whitespace-nowrap tabular-nums',
                cell: (row) => <CurrencyAmount value={row.amountPesewas} />,
              },
              {
                id: 'outstanding',
                header: 'Outstanding',
                className: 'whitespace-nowrap tabular-nums',
                cell: (row) => (
                  <CurrencyAmount value={row.outstandingPesewas} className="text-danger" />
                ),
              },
              {
                id: 'weekly',
                header: 'Weekly',
                className: 'whitespace-nowrap tabular-nums',
                cell: (row) => <CurrencyAmount value={row.weeklyPaymentPesewas} />,
              },
              {
                id: 'status',
                header: 'Status',
                className: 'whitespace-nowrap',
                cell: (row) => <LoanStatusBadge status={row.status} />,
              },
              { id: 'cycle', header: 'Cycle', className: 'whitespace-nowrap', cell: (row) => row.cycleBatch },
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
          <p className="text-small text-text-muted">
            Showing {filteredEntries.length} of {data.length} loans
          </p>
        </>
      )}
    </div>
  );
}
