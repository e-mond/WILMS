'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  CollectorPaymentStatusBadge,
  CurrencyAmount,
  DataTable,
  KpiCard,
} from '@/components/data-display';
import { GuidedEmptyState } from '@/components/feedback/GuidedEmptyState';
import { QueryErrorState } from '@/components/feedback/QueryErrorState';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { EMPTY_STATE_COPY } from '@/constants/empty-state-copy';
import { QrBarcodeScanner } from '@/features/mobile/components/QrBarcodeScanner';
import { matchesAnySearchField } from '@/utils/search-match';
import { ExecutiveKpiGrid, ManagementToolbar } from '@/components/layout/executive';
import { Input } from '@/components/ui/Input';
import { useCollectorBorrowers } from '@/features/payment-collection/hooks/useCollectorBorrowers';
import { COLLECTOR_PAYMENT_STATUS, type CollectorDashboardBorrower } from '@/types/collector-dashboard';

function filterBorrowers(
  borrowers: CollectorDashboardBorrower[],
  searchQuery: string,
): CollectorDashboardBorrower[] {
  const normalizedQuery = searchQuery.trim();

  if (!normalizedQuery) {
    return borrowers;
  }

  return borrowers.filter((borrower) =>
    matchesAnySearchField(searchQuery, [
      borrower.borrowerName,
      borrower.community,
      borrower.phone,
      borrower.borrowerId,
      borrower.groupName,
      borrower.loanId,
    ]),
  );
}

function sortBorrowers(borrowers: CollectorDashboardBorrower[]): CollectorDashboardBorrower[] {
  const statusPriority = {
    [COLLECTOR_PAYMENT_STATUS.MISSED]: 0,
    [COLLECTOR_PAYMENT_STATUS.PENDING]: 1,
    [COLLECTOR_PAYMENT_STATUS.COLLECTED]: 2,
  };

  return [...borrowers].sort((left, right) => {
    const priorityDiff = statusPriority[left.paymentStatus] - statusPriority[right.paymentStatus];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return left.borrowerName.localeCompare(right.borrowerName);
  });
}

export function CollectorMyBorrowersPanel() {
  const { data, isLoading, isError, error, refetch } = useCollectorBorrowers();
  const [searchQuery, setSearchQuery] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const borrowers = useMemo(
    () => sortBorrowers(filterBorrowers(data ?? [], searchQuery)),
    [data, searchQuery],
  );

  const missedCount = useMemo(
    () => (data ?? []).filter((b) => b.paymentStatus === COLLECTOR_PAYMENT_STATUS.MISSED).length,
    [data],
  );

  if (isLoading) {
    return <LoadingSpinner label="Loading assigned borrowers" className="py-wilms-8" />;
  }

  if (isError) {
    return <QueryErrorState error={error} onRetry={() => void refetch()} />;
  }

  if (!data?.length) {
    return (
      <GuidedEmptyState
        {...EMPTY_STATE_COPY.collectorsDashboard}
        title="No assigned borrowers"
        description="Active loans assigned to you will appear here."
        actionHref="/collector/dashboard"
        actionLabel="View collection dashboard"
      />
    );
  }

  return (
    <div className="space-y-wilms-4">
      <ExecutiveKpiGrid>
        <KpiCard variant="executive" label="Assigned Borrowers" value={data.length} />
        <KpiCard
          variant="executive"
          label="Missed / Overdue"
          value={missedCount}
          valueClassName="text-danger"
        />
        <KpiCard variant="executive" label="Showing" value={borrowers.length} />
      </ExecutiveKpiGrid>

      <ManagementToolbar
        search={
          <Input
            aria-label="Search borrowers"
            placeholder="Search by name, phone, or community"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        }
        actions={
          <Button type="button" variant="secondary" size="sm" onClick={() => setShowScanner(true)}>
            Scan code
          </Button>
        }
      />

      {showScanner ? (
        <div className="rounded-sm border border-border bg-card p-wilms-4">
          <QrBarcodeScanner
            title="Scan borrower or loan code"
            onScan={(value) => {
              setSearchQuery(value.trim());
              setShowScanner(false);
            }}
            onClose={() => setShowScanner(false)}
          />
        </div>
      ) : null}

      <DataTable<CollectorDashboardBorrower>
        variant="executive"
        caption="Assigned borrowers due for collection"
        data={borrowers}
        emptyMessage="No borrowers match your search."
        getRowId={(row) => row.borrowerId}
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
          {
            id: 'expected',
            header: 'Expected',
            cell: (row) => <CurrencyAmount value={row.expectedPesewas} />,
          },
          {
            id: 'collected',
            header: 'Collected',
            cell: (row) => (
              <CurrencyAmount value={row.collectedPesewas} className="text-status-active" />
            ),
          },
          {
            id: 'status',
            header: 'Status',
            cell: (row) => <CollectorPaymentStatusBadge status={row.paymentStatus} />,
          },
          {
            id: 'action',
            header: 'Action',
            cell: (row) => (
              <Link
                href={`/collector/payment/${row.borrowerId}`}
                className="text-small font-semibold text-brand-primary hover:underline"
              >
                Record payment
              </Link>
            ),
          },
        ]}
      />
    </div>
  );
}
