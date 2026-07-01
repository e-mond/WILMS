'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { DataTable, KpiCard, StatusBadge, Avatar } from '@/components/data-display';
import { EmptyState } from '@/components/feedback/EmptyState';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import {
  ExecutiveKpiGrid,
  FilterPillBar,
  ManagementToolbar,
} from '@/components/layout/executive';
import { useQueryLoadingPolicy } from '@/hooks/useQueryLoadingPolicy';
import { Input } from '@/components/ui/Input';
import { ExportCsvButton } from '@/features/reports/components/ExportCsvButton';
import { WILMS_REPORT_TYPE } from '@/features/export';
import { BorrowersAsidePanel } from '@/features/borrower-management/components/BorrowersAsidePanel';
import { ApplicationsAsidePanel } from '@/features/borrower-management/components/ApplicationsAsidePanel';
import { BORROWER_STATUS_FILTER_OPTIONS } from '@/constants/borrower-status';
import { filterBorrowerSummaries } from '@/features/borrower-management/borrower-list.utils';
import { summarizeBorrowerList } from '@/features/borrower-management/borrower-list-summary';
import { useBorrowers } from '@/features/borrower-management/hooks/useBorrowers';
import { useShellAsideContent } from '@/hooks/useShellAsideContent';
import type { BorrowerSummary } from '@/types/borrower';
import { BORROWER_STATUS } from '@/types/borrower';
import { resolveBorrowerDisplayId } from '@/utils/format-borrower-display-id';
import { resolveEntityPhotoUrl } from '@/utils/entity-photo';

const STATUS_FILTERS = BORROWER_STATUS_FILTER_OPTIONS.map((option) => ({
  value: option.value,
  label: option.value ? option.label : 'All',
}));

export function BorrowerList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFromUrl = searchParams.get('status') ?? '';
  const { data, isLoading, isError, refetch } = useBorrowers();
  const { showLoading, isTimedOut } = useQueryLoadingPolicy({ isLoading });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(statusFromUrl);

  useEffect(() => {
    setStatusFilter(statusFromUrl);
  }, [statusFromUrl]);

  function handleStatusFilterChange(nextStatus: string) {
    setStatusFilter(nextStatus);

    const params = new URLSearchParams(searchParams.toString());

    if (nextStatus) {
      params.set('status', nextStatus);
    } else {
      params.delete('status');
    }

    const query = params.toString();
    router.replace(query ? `/borrowers?${query}` : '/borrowers', { scroll: false });
  }

  const filteredBorrowers = useMemo(
    () =>
      filterBorrowerSummaries(data ?? [], {
        searchQuery,
        statusFilter,
      }),
    [data, searchQuery, statusFilter],
  );

  const summary = useMemo(() => summarizeBorrowerList(data ?? []), [data]);

  const isApplicationsView = statusFromUrl === BORROWER_STATUS.PENDING;

  const atRiskCount = useMemo(
    () =>
      (data ?? []).filter(
        (borrower) =>
          borrower.status === BORROWER_STATUS.AT_RISK ||
          borrower.status === BORROWER_STATUS.DEFAULTED ||
          borrower.status === BORROWER_STATUS.BLACKLISTED,
      ).length,
    [data],
  );

  const asideContent = useMemo(() => {
    if (isApplicationsView) {
      return (
        <ApplicationsAsidePanel
          pendingCount={summary.pendingBorrowers}
          totalSubmitted={summary.totalBorrowers}
        />
      );
    }

    return (
      <BorrowersAsidePanel
        totalBorrowers={summary.totalBorrowers}
        approvedCount={summary.approvedBorrowers}
        atRiskCount={atRiskCount}
      />
    );
  }, [atRiskCount, isApplicationsView, summary]);

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
      <EmptyState
        title="Unable to load borrowers"
        description="Check your connection and try again."
      />
    );
  }

  if (!data?.length) {
    return (
      <EmptyState
        title="No borrowers yet"
        description="Registered borrowers will appear here after submission."
      />
    );
  }

  const csvRows = filteredBorrowers.map((borrower) => [
    resolveBorrowerDisplayId(borrower),
    borrower.fullName,
    borrower.phone,
    borrower.groupName,
    borrower.status,
  ]);

  return (
    <div className="space-y-wilms-4">
      <ExecutiveKpiGrid>
        <KpiCard variant="executive" label="Total Borrowers" value={summary.totalBorrowers} />
        <KpiCard
          variant="executive"
          label="Approved"
          value={summary.approvedBorrowers}
          valueClassName="text-status-active"
        />
        <KpiCard
          variant="executive"
          label="Pending"
          value={summary.pendingBorrowers}
          valueClassName="text-brand-primary"
        />
        <KpiCard
          variant="executive"
          label="Blacklisted"
          value={summary.blacklistedBorrowers}
          valueClassName="text-danger"
        />
      </ExecutiveKpiGrid>

      <ManagementToolbar
        search={
          <Input
            aria-label="Search borrowers"
            placeholder="Search by name, phone, or group"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        }
        filters={
          <FilterPillBar
            ariaLabel="Filter borrowers by status"
            options={STATUS_FILTERS}
            value={statusFilter}
            onChange={handleStatusFilterChange}
          />
        }
        actions={
          <ExportCsvButton
            label="Export"
            filename="borrowers.csv"
            reportType={WILMS_REPORT_TYPE.BORROWER_LIST}
            reportTitle="Borrower Directory Export"
            headers={['Borrower ID', 'Full Name', 'Phone Number', 'Group', 'Status']}
            rows={csvRows}
          />
        }
      />

      {filteredBorrowers.length === 0 ? (
        <EmptyState
          title="No borrowers match your filters"
          description="Try a different status or search term."
        />
      ) : (
        <>
          <DataTable<BorrowerSummary>
            variant="executive"
            caption="Borrower directory"
            data={filteredBorrowers}
            emptyMessage="No borrowers match your filters."
            getRowId={(row) => row.id}
            columns={[
              {
                id: 'id',
                header: 'Borrower ID',
                cell: (row) => (
                  <span className="font-semibold text-brand-primary">
                    {resolveBorrowerDisplayId(row)}
                  </span>
                ),
              },
              {
                id: 'name',
                header: 'Borrower',
                cell: (row) => (
                  <div className="flex items-center gap-wilms-3">
                    <Avatar
                      label={row.fullName}
                      photoUrl={resolveEntityPhotoUrl({ name: row.fullName, id: row.id, photoUrl: row.photoUrl })}
                      size="sm"
                    />
                    <div>
                      <p className="font-semibold text-text-primary">{row.fullName}</p>
                      <p className="text-small text-text-muted">{row.phone}</p>
                    </div>
                  </div>
                ),
              },
              {
                id: 'group',
                header: 'Group',
                cell: (row) =>
                  row.groupId ? (
                    <Link
                      href={`/groups/${row.groupId}`}
                      className="font-semibold text-brand-primary hover:underline"
                    >
                      {row.groupName}
                    </Link>
                  ) : (
                    row.groupName
                  ),
              },
              {
                id: 'status',
                header: 'Status',
                cell: (row) => <StatusBadge status={row.status} />,
              },
              {
                id: 'action',
                header: 'Profile',
                cell: (row) => (
                  <Link
                    href={`/borrowers/${row.id}`}
                    className="text-small font-semibold text-brand-primary hover:underline"
                  >
                    View profile
                  </Link>
                ),
              },
            ]}
          />
          <p className="text-small text-text-muted">
            Showing {filteredBorrowers.length} of {data.length} borrowers
          </p>
        </>
      )}
    </div>
  );
}
