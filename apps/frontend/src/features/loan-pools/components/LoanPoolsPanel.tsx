'use client';

import { useMemo, useState } from 'react';
import { CurrencyAmount, DataTable, KpiCard, UtilisationBar } from '@/components/data-display';
import { LoanPoolsKpiIcon } from '@/components/icons/LoanPoolsKpiIcon';
import {
  ExecutiveKpiGrid,
  FilterPillBar,
  ManagementToolbar,
} from '@/components/layout/executive';
import { ExportCsvButton } from '@/features/reports/components/ExportCsvButton';
import { WILMS_REPORT_TYPE } from '@/features/export';
import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { LoanPoolsAsidePanel } from '@/features/loan-pools/components/LoanPoolsAsidePanel';
import { LoanPoolsMobileCardList } from '@/features/loan-pools/components/LoanPoolsMobileCardList';
import { useLoanPools } from '@/features/loan-pools/hooks/useLoanPools';
import { usePaginatedRows } from '@/hooks/usePaginatedRows';
import { useShellAsideContent } from '@/hooks/useShellAsideContent';
import { useToast } from '@/hooks/useToast';
import { LOAN_POOL_STATUS, type LoanPoolSummary } from '@/types/loan-pool';
import { formatPesewasForCsv } from '@/utils/export-csv';

const POOL_STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: LOAN_POOL_STATUS.ACTIVE, label: 'Active' },
  { value: LOAN_POOL_STATUS.NEAR_FULL, label: 'Near Full' },
  { value: LOAN_POOL_STATUS.LAUNCHING, label: 'Launching' },
];

export function LoanPoolsPanel() {
  const toast = useToast();
  const { data, isLoading, isError } = useLoanPools();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredPools = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return (data?.pools ?? []).filter((pool) => {
      const matchesSearch =
        !query ||
        pool.name.toLowerCase().includes(query) ||
        pool.id.toLowerCase().includes(query) ||
        pool.region.toLowerCase().includes(query);
      const matchesStatus = !statusFilter || pool.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [data?.pools, searchQuery, statusFilter]);

  const { page, pageCount, setPage, slice, total } = usePaginatedRows(filteredPools);

  const selected =
    filteredPools.find((pool) => pool.id === selectedId) ?? slice[0] ?? null;

  const recentActivity = useMemo(() => {
    if (!data?.pools) {
      return [];
    }

    return data.pools
      .flatMap((pool) => {
        const events = [];

        if (pool.status === LOAN_POOL_STATUS.NEAR_FULL) {
          events.push({
            id: `${pool.id}-near-capacity`,
            message: `${pool.id} near capacity`,
            recordedAt: `${pool.lastReplenishedAt}T17:30:00.000Z`,
          });
        }

        events.push({
          id: `${pool.id}-replenished`,
          message: `${pool.id} replenished`,
          recordedAt: `${pool.lastReplenishedAt}T09:00:00.000Z`,
        });

        return events;
      })
      .slice(0, 5);
  }, [data?.pools]);

  const asideContent = useMemo(
    () =>
      data ? (
        <LoanPoolsAsidePanel
          selected={selected}
          allocation={data.allocation}
          recentActivity={recentActivity}
        />
      ) : null,
    [data, selected, recentActivity],
  );

  useShellAsideContent(asideContent);

  if (isLoading) {
    return <LoadingSpinner label="Loading loan pools" className="py-wilms-8" />;
  }

  if (isError || !data) {
    return <EmptyState title="Unable to load loan pools" description="Try again shortly." />;
  }

  const csvRows = filteredPools.map((pool) => [
    pool.id,
    pool.name,
    pool.region,
    pool.source,
    formatPesewasForCsv(pool.capitalPesewas),
    formatPesewasForCsv(pool.disbursedPesewas),
    formatPesewasForCsv(pool.collectedPesewas),
    formatPesewasForCsv(pool.outstandingPesewas),
    String(pool.utilisationPercent),
    pool.status,
  ]);

  return (
    <div className="space-y-wilms-4">
      <ExecutiveKpiGrid>
        <KpiCard
          variant="executive"
          label="Total Pool Funds"
          value={<CurrencyAmount value={data.summary.totalPoolFundsPesewas} />}
          valueClassName="text-brand-primary"
          icon={<LoanPoolsKpiIcon name="pool-funds" />}
        />
        <KpiCard
          variant="executive"
          label="Active Pools"
          value={data.summary.activePools}
          valueClassName="text-brand-primary"
          icon={<LoanPoolsKpiIcon name="active-pools" />}
        />
        <KpiCard
          variant="executive"
          label="Total Disbursed"
          value={<CurrencyAmount value={data.summary.totalDisbursedPesewas} />}
          valueClassName="text-status-active"
          icon={<LoanPoolsKpiIcon name="disbursed" />}
        />
        <KpiCard
          variant="executive"
          label="Total Outstanding"
          value={<CurrencyAmount value={data.summary.totalOutstandingPesewas} />}
          valueClassName="text-danger"
          icon={<LoanPoolsKpiIcon name="outstanding" />}
        />
      </ExecutiveKpiGrid>

      <ManagementToolbar
        search={
          <Input
            aria-label="Search loan pools"
            placeholder="Search pools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        }
        filters={
          <FilterPillBar
            ariaLabel="Filter loan pools by status"
            options={POOL_STATUS_FILTERS}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        }
        actions={
          <>
            <ExportCsvButton
              label="Export"
              showDownloadIcon
              filename="loan-pools.csv"
              reportType={WILMS_REPORT_TYPE.LOAN_POOL}
              reportTitle="Loan Pools Export"
              headers={[
                'Pool ID',
                'Pool Name',
                'Region',
                'Funding Source',
                'Capital (GHS)',
                'Disbursed (GHS)',
                'Collected (GHS)',
                'Outstanding (GHS)',
                'Utilisation %',
                'Status',
              ]}
              rows={csvRows}
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() =>
                toast.info('New Pool', { message: 'Pool creation workflow is not yet available.' })
              }
            >
              + New Pool
            </Button>
          </>
        }
      />
      <LoanPoolsMobileCardList pools={slice} selectedId={selected?.id} onSelect={setSelectedId} />
      <div className="hidden lg:block">
      <DataTable<LoanPoolSummary>
        variant="executive"
        caption="Loan pools"
        data={slice}
        getRowId={(row) => row.id}
        selectedRowId={selected?.id}
        onRowClick={(row) => setSelectedId(row.id)}
        columns={[
          {
            id: 'pool',
            header: 'Pool',
            cell: (row) => (
              <div className="text-left">
                <p className="font-semibold text-text-primary">{row.name}</p>
                <p className="text-small font-semibold text-executive-gold">{row.id}</p>
              </div>
            ),
          },
          { id: 'region', header: 'Region', cell: (row) => row.region },
          { id: 'source', header: 'Source', cell: (row) => row.source },
          {
            id: 'capital',
            header: 'Capital',
            cell: (row) => (
              <CurrencyAmount value={row.capitalPesewas} className="text-brand-primary" />
            ),
          },
          {
            id: 'disbursed',
            header: 'Disbursed',
            cell: (row) => <CurrencyAmount value={row.disbursedPesewas} />,
          },
          {
            id: 'collected',
            header: 'Collected',
            cell: (row) => (
              <CurrencyAmount value={row.collectedPesewas} className="text-status-active" />
            ),
          },
          {
            id: 'outstanding',
            header: 'Outstanding',
            cell: (row) => (
              <CurrencyAmount value={row.outstandingPesewas} className="text-danger" />
            ),
          },
          {
            id: 'utilisation',
            header: 'Utilisation',
            cell: (row) => <UtilisationBar percent={row.utilisationPercent} />,
          },
        ]}
      />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-wilms-3">
        <p className="text-small text-text-muted">
          Showing {slice.length} of {total} pools
        </p>
        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} ariaLabel="Loan pools pagination" />
      </div>
    </div>
  );
}
