'use client';

import { useCallback, useMemo, useState } from 'react';
import { CurrencyAmount, DataTable, KpiCard, UtilisationBar } from '@/components/data-display';
import { LoanPoolsKpiIcon } from '@/components/icons/LoanPoolsKpiIcon';
import {
  ExecutiveKpiGrid,
  FilterDropdown,
  FilterDropdownRow,
  ManagementToolbar,
} from '@/components/layout/executive';
import { ExportCsvButton } from '@/features/reports/components/ExportCsvButton';
import { WILMS_REPORT_TYPE } from '@/features/export';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { FormField } from '@/components/forms';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { LoanPoolsAsidePanel } from '@/features/loan-pools/components/LoanPoolsAsidePanel';
import { LoanPoolsMobileCardList } from '@/features/loan-pools/components/LoanPoolsMobileCardList';
import { useLoanPools } from '@/features/loan-pools/hooks/useLoanPools';
import { useCreateLoanPool } from '@/features/loan-pools/hooks/useCreateLoanPool';
import { usePaginatedRows } from '@/hooks/usePaginatedRows';
import { useQueryLoadingPolicy } from '@/hooks/useQueryLoadingPolicy';
import { useShellAsideContent } from '@/hooks/useShellAsideContent';
import { LOAN_POOL_STATUS, type LoanPoolSummary } from '@/types/loan-pool';
import { ghsInputToPesewas } from '@/utils/reconciliation.schema';
import { formatPesewasForCsv } from '@/utils/export-csv';
import { resolvePoolDisplayId } from '@/utils/entity-display-id';

const POOL_STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: LOAN_POOL_STATUS.ACTIVE, label: 'Active' },
  { value: LOAN_POOL_STATUS.NEAR_FULL, label: 'Near Full' },
  { value: LOAN_POOL_STATUS.LAUNCHING, label: 'Launching' },
];

export function LoanPoolsPanel() {
  const { data, isLoading, isError, error, refetch } = useLoanPools();
  const { showLoading, isTimedOut, isForbidden } = useQueryLoadingPolicy({ isLoading, isError, error });
  const createLoanPool = useCreateLoanPool();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [poolName, setPoolName] = useState('');
  const [poolRegion, setPoolRegion] = useState('');
  const [poolSource, setPoolSource] = useState('');
  const [capitalGhs, setCapitalGhs] = useState('');
  const [cycleLabel, setCycleLabel] = useState('');

  const closeCreateModal = useCallback(() => {
    setCreateModalOpen(false);
  }, []);

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
            message: `${resolvePoolDisplayId(pool)} near capacity`,
            recordedAt: `${pool.lastReplenishedAt}T17:30:00.000Z`,
          });
        }

        events.push({
          id: `${pool.id}-replenished`,
          message: `${resolvePoolDisplayId(pool)} replenished`,
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

  const csvRows = (data?.pools ?? filteredPools).map((pool) => [
    resolvePoolDisplayId(pool),
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
    <>
    <QueryStatePanel
      isLoading={isLoading}
      showLoading={showLoading}
      isTimedOut={isTimedOut}
      isError={isError}
      error={error}
      isForbidden={isForbidden}
      onRetry={() => void refetch()}
      variant="table"
    >
      {data ? (
    <div className="space-y-wilms-4">
      <div className="rounded-sm border border-border bg-muted/40 p-wilms-4">
        <h2 className="text-body font-semibold text-text-primary">What is a Loan Pool?</h2>
        <p className="mt-wilms-2 text-small text-text-muted">
          A loan pool is a fund allocated for issuing loans. Every loan issued is drawn from a pool,
          allowing administrators to monitor capital allocation, repayments, and utilization.
        </p>
      </div>
      <div data-tour="loan-pool-kpis">
      <ExecutiveKpiGrid className="sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        <KpiCard
          variant="executive"
          label="Total Pool Funds"
          value={<CurrencyAmount value={data.summary.totalPoolFundsPesewas} />}
          valueClassName="text-brand-primary whitespace-nowrap tabular-nums"
          icon={<LoanPoolsKpiIcon name="pool-funds" />}
        />
        <KpiCard
          variant="executive"
          label="Active Pools"
          value={data.summary.activePools}
          valueClassName="text-brand-primary tabular-nums"
          icon={<LoanPoolsKpiIcon name="active-pools" />}
        />
        <KpiCard
          variant="executive"
          label="Total Disbursed"
          value={<CurrencyAmount value={data.summary.totalDisbursedPesewas} />}
          valueClassName="text-status-active whitespace-nowrap tabular-nums"
          icon={<LoanPoolsKpiIcon name="disbursed" />}
        />
        <KpiCard
          variant="executive"
          label="Total Collected"
          value={<CurrencyAmount value={data.summary.totalCollectedPesewas} />}
          valueClassName="text-status-active whitespace-nowrap tabular-nums"
          icon={<LoanPoolsKpiIcon name="disbursed" />}
        />
        <KpiCard
          variant="executive"
          label="Total Outstanding"
          value={<CurrencyAmount value={data.summary.totalOutstandingPesewas} />}
          valueClassName="text-danger whitespace-nowrap tabular-nums"
          icon={<LoanPoolsKpiIcon name="outstanding" />}
        />
      </ExecutiveKpiGrid>
      </div>

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
          <FilterDropdownRow>
            <FilterDropdown
              label="Status"
              ariaLabel="Filter loan pools by status"
              options={POOL_STATUS_FILTERS}
              value={statusFilter}
              onChange={setStatusFilter}
            />
          </FilterDropdownRow>
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
              onClick={() => setCreateModalOpen(true)}
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
                <p className="text-small font-semibold text-executive-gold">{resolvePoolDisplayId(row)}</p>
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
      ) : null}
    </QueryStatePanel>

      <Modal
        isOpen={createModalOpen}
        onClose={closeCreateModal}
        title="Create Loan Pool"
        footer={
          <>
            <Button type="button" variant="secondary" size="sm" onClick={closeCreateModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-loan-pool-form"
              variant="primary"
              size="sm"
              disabled={
                createLoanPool.isPending ||
                !poolName.trim() ||
                !poolRegion.trim() ||
                !poolSource.trim() ||
                !capitalGhs.trim() ||
                !cycleLabel.trim() ||
                Number.isNaN(Number(capitalGhs)) ||
                Number(capitalGhs) <= 0
              }
            >
              {createLoanPool.isPending ? 'Creating…' : 'Create Pool'}
            </Button>
          </>
        }
      >
        <form
          id="create-loan-pool-form"
          className="space-y-wilms-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (
              createLoanPool.isPending ||
              !poolName.trim() ||
              !poolRegion.trim() ||
              !poolSource.trim() ||
              !capitalGhs.trim() ||
              !cycleLabel.trim() ||
              Number.isNaN(Number(capitalGhs)) ||
              Number(capitalGhs) <= 0
            ) {
              return;
            }

            void createLoanPool
              .mutateAsync({
                name: poolName.trim(),
                region: poolRegion.trim(),
                source: poolSource.trim(),
                capitalPesewas: ghsInputToPesewas(capitalGhs),
                cycleLabel: cycleLabel.trim(),
              })
              .then(() => {
                closeCreateModal();
                setPoolName('');
                setPoolRegion('');
                setPoolSource('');
                setCapitalGhs('');
                setCycleLabel('');
              });
          }}
        >
          <FormField label="Pool name" htmlFor="pool-name" required>
            <Input
              id="pool-name"
              autoFocus
              value={poolName}
              onChange={(event) => setPoolName(event.target.value)}
            />
          </FormField>
          <FormField label="Region" htmlFor="pool-region" required>
            <Input
              id="pool-region"
              value={poolRegion}
              onChange={(event) => setPoolRegion(event.target.value)}
            />
          </FormField>
          <FormField label="Funding source" htmlFor="pool-source" required>
            <Input
              id="pool-source"
              value={poolSource}
              onChange={(event) => setPoolSource(event.target.value)}
            />
          </FormField>
          <FormField label="Capital (GHS)" htmlFor="pool-capital" required>
            <Input
              id="pool-capital"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={capitalGhs}
              onChange={(event) => setCapitalGhs(event.target.value)}
              placeholder="100000"
            />
          </FormField>
          <FormField label="Cycle label" htmlFor="pool-cycle" required>
            <Input
              id="pool-cycle"
              value={cycleLabel}
              onChange={(event) => setCycleLabel(event.target.value)}
              placeholder="Jul 2026"
            />
          </FormField>
        </form>
      </Modal>
    </>
  );
}
