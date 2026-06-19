'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CurrencyAmount, DataTable, KpiCard } from '@/components/data-display';
import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { ExecutiveKpiGrid, ManagementToolbar } from '@/components/layout/executive';
import { Input } from '@/components/ui/Input';
import { useBorrowersAwaitingAdminFee } from '@/features/admin-fee/hooks/useBorrowersAwaitingAdminFee';
import type { AwaitingAdminFeeBorrower } from '@/types/transaction';

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

export function AwaitingAdminFeeList() {
  const { data, isLoading, isError } = useBorrowersAwaitingAdminFee();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBorrowers = useMemo(
    () => filterAwaitingBorrowers(data ?? [], searchQuery),
    [data, searchQuery],
  );

  if (isLoading) {
    return <LoadingSpinner label="Loading borrowers awaiting admin fee" className="py-wilms-8" />;
  }

  if (isError) {
    return (
      <EmptyState
        title="Unable to load admin fee queue"
        description="Check your connection and try again."
      />
    );
  }

  if (!data?.length) {
    return (
      <EmptyState
        title="No admin fees pending"
        description="All approved borrowers have recorded admin fees."
      />
    );
  }

  const totalFeePesewas = data.reduce((sum, row) => sum + row.requiredAmountPesewas, 0);

  return (
    <div className="space-y-wilms-4">
      <ExecutiveKpiGrid>
        <KpiCard variant="executive" label="Awaiting fee" value={data.length} />
        <KpiCard variant="executive" label="Filtered" value={filteredBorrowers.length} />
        <KpiCard
          variant="executive"
          label="Total required"
          value={<CurrencyAmount value={totalFeePesewas} />}
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
    </div>
  );
}
