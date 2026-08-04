'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CurrencyAmount, DataTable, KpiCard } from '@/components/data-display';
import { GuidedEmptyState } from '@/components/feedback/GuidedEmptyState';
import { QueryErrorState } from '@/components/feedback/QueryErrorState';
import { InlinePanelSkeleton } from '@/components/feedback/PageSkeletons';
import { EMPTY_STATE_COPY } from '@/constants/empty-state-copy';
import { ExecutiveKpiGrid, ManagementToolbar } from '@/components/layout/executive';
import { Input } from '@/components/ui/Input';
import { useBorrowersAwaitingAdminFee } from '@/features/admin-fee/hooks/useBorrowersAwaitingAdminFee';
import { useCollectedAdminFees } from '@/features/admin-fee/hooks/useCollectedAdminFees';
import type { AwaitingAdminFeeBorrower, CollectedAdminFeeRecord } from '@/types/transaction';
import { formatDisplayDate } from '@/utils/format-date';

function filterAwaitingBorrowers(
  borrowers: readonly AwaitingAdminFeeBorrower[],
  searchQuery: string,
): AwaitingAdminFeeBorrower[] {
  const normalized = searchQuery.trim().toLowerCase();

  if (!normalized) {
    return [...borrowers];
  }

  return borrowers.filter(
    (borrower) =>
      borrower.fullName.toLowerCase().includes(normalized) ||
      borrower.phone.includes(normalized) ||
      borrower.community.toLowerCase().includes(normalized),
  );
}

function filterCollectedFees(
  fees: readonly CollectedAdminFeeRecord[],
  searchQuery: string,
): CollectedAdminFeeRecord[] {
  const normalized = searchQuery.trim().toLowerCase();

  if (!normalized) {
    return [...fees];
  }

  return fees.filter(
    (fee) =>
      fee.borrowerName.toLowerCase().includes(normalized) ||
      fee.phone.includes(normalized) ||
      fee.community.toLowerCase().includes(normalized) ||
      fee.groupName.toLowerCase().includes(normalized),
  );
}

export function AwaitingAdminFeeList() {
  const awaitingQuery = useBorrowersAwaitingAdminFee();
  const collectedQuery = useCollectedAdminFees({ scopedToCollector: true });
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBorrowers = useMemo(
    () => filterAwaitingBorrowers(awaitingQuery.data ?? [], searchQuery),
    [awaitingQuery.data, searchQuery],
  );

  const filteredCollected = useMemo(
    () => filterCollectedFees(collectedQuery.data ?? [], searchQuery),
    [collectedQuery.data, searchQuery],
  );

  if (awaitingQuery.isLoading || collectedQuery.isLoading) {
    return <InlinePanelSkeleton />;
  }

  if (awaitingQuery.isError) {
    return (
      <QueryErrorState error={awaitingQuery.error} onRetry={() => void awaitingQuery.refetch()} />
    );
  }

  const awaiting = awaitingQuery.data ?? [];
  const collected = collectedQuery.data ?? [];

  if (!awaiting.length && !collected.length) {
    return <GuidedEmptyState {...EMPTY_STATE_COPY.adminFeeQueue} />;
  }

  const totalDuePesewas = awaiting.reduce((sum, row) => sum + row.requiredAmountPesewas, 0);
  const totalCollectedPesewas = collected.reduce((sum, row) => sum + row.amountPesewas, 0);

  return (
    <div className="space-y-wilms-6">
      <ExecutiveKpiGrid>
        <KpiCard variant="executive" label="Awaiting fee" value={awaiting.length} />
        <KpiCard
          variant="executive"
          label="Due total"
          value={<CurrencyAmount value={totalDuePesewas} />}
        />
        <KpiCard variant="executive" label="Previously collected" value={collected.length} />
        <KpiCard
          variant="executive"
          label="Collected total"
          value={<CurrencyAmount value={totalCollectedPesewas} />}
        />
      </ExecutiveKpiGrid>

      <ManagementToolbar
        search={
          <Input
            type="search"
            placeholder="Search by name, phone, or community"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            aria-label="Search admin fee queue"
          />
        }
      />

      <section className="space-y-wilms-3">
        <h2 className="text-heading-3 font-semibold text-text-primary">Fees due</h2>
        {filteredBorrowers.length === 0 ? (
          <p className="text-body text-text-muted">No borrowers currently awaiting an admin fee.</p>
        ) : (
          <DataTable<AwaitingAdminFeeBorrower>
            variant="executive"
            caption="Borrowers awaiting admin fee"
            data={filteredBorrowers}
            getRowId={(row) => row.id}
            columns={[
              {
                id: 'name',
                header: 'Borrower',
                cell: (row) => (
                  <div>
                    <p className="font-semibold text-text-primary">{row.fullName}</p>
                    <p className="text-small text-text-muted">{row.phone}</p>
                  </div>
                ),
              },
              {
                id: 'community',
                header: 'Community',
                cell: (row) => row.community,
              },
              {
                id: 'fee',
                header: 'Required fee',
                cell: (row) => <CurrencyAmount value={row.requiredAmountPesewas} />,
              },
              {
                id: 'action',
                header: 'Action',
                cell: (row) => (
                  <Link
                    href={`/collector/admin-fee/${row.id}`}
                    className="text-small font-semibold text-brand-primary hover:underline"
                  >
                    Record fee
                  </Link>
                ),
              },
            ]}
          />
        )}
      </section>

      <section className="space-y-wilms-3">
        <h2 className="text-heading-3 font-semibold text-text-primary">Previously collected</h2>
        {collectedQuery.isError ? (
          <QueryErrorState
            error={collectedQuery.error}
            onRetry={() => void collectedQuery.refetch()}
            title="Unable to load collected fees"
          />
        ) : filteredCollected.length === 0 ? (
          <p className="text-body text-text-muted">No admin fees collected yet.</p>
        ) : (
          <DataTable<CollectedAdminFeeRecord>
            variant="executive"
            caption="Collected admin fees"
            data={filteredCollected}
            getRowId={(row) => row.transactionId}
            columns={[
              {
                id: 'name',
                header: 'Borrower',
                cell: (row) => (
                  <div>
                    <p className="font-semibold text-text-primary">{row.borrowerName}</p>
                    <p className="text-small text-text-muted">{row.groupName}</p>
                  </div>
                ),
              },
              {
                id: 'amount',
                header: 'Amount',
                cell: (row) => <CurrencyAmount value={row.amountPesewas} />,
              },
              {
                id: 'recorded',
                header: 'Recorded',
                cell: (row) => formatDisplayDate(row.recordedAt.slice(0, 10)),
              },
            ]}
          />
        )}
      </section>
    </div>
  );
}
