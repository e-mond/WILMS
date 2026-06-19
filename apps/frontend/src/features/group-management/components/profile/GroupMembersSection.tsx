'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  Avatar,
  CurrencyAmount,
  DataTable,
  StatusBadge,
} from '@/components/data-display';
import { ProfileSection } from '@/components/layout/executive/ProfileSection';
import { Input } from '@/components/ui/Input';
import { FilterPillBar } from '@/components/layout/executive';
import {
  GROUP_MEMBER_LOAN_STATUS,
  GROUP_MEMBER_ROLE,
} from '@/types/group';
import type { GroupMemberDetail } from '@/types/group-detail';
import { formatDisplayDate } from '@/utils/format-date';
import { resolveEntityPhotoUrl } from '@/utils/entity-photo';

const LOAN_STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: GROUP_MEMBER_LOAN_STATUS.ACTIVE, label: 'Active loan' },
  { value: GROUP_MEMBER_LOAN_STATUS.COMPLETED, label: 'Completed' },
  { value: GROUP_MEMBER_LOAN_STATUS.DEFAULTED, label: 'Defaulted' },
  { value: GROUP_MEMBER_LOAN_STATUS.NONE, label: 'No loan' },
];

function loanStatusLabel(status: GroupMemberDetail['loanStatus']): string {
  switch (status) {
    case GROUP_MEMBER_LOAN_STATUS.ACTIVE:
      return 'Active';
    case GROUP_MEMBER_LOAN_STATUS.COMPLETED:
      return 'Completed';
    case GROUP_MEMBER_LOAN_STATUS.DEFAULTED:
      return 'Defaulted';
    default:
      return 'No loan';
  }
}

export interface GroupMembersSectionProps {
  members: GroupMemberDetail[];
}

export function GroupMembersSection({ members }: GroupMembersSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loanFilter, setLoanFilter] = useState('');

  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return members.filter((member) => {
      const matchesSearch =
        !query ||
        member.fullName.toLowerCase().includes(query) ||
        member.borrowerId.toLowerCase().includes(query) ||
        member.phone.includes(query);
      const matchesLoan = !loanFilter || member.loanStatus === loanFilter;

      return matchesSearch && matchesLoan;
    });
  }, [members, searchQuery, loanFilter]);

  return (
    <ProfileSection title="Group Members">
      <div className="mb-wilms-4 space-y-wilms-3">
        <Input
          aria-label="Search group members"
          placeholder="Search members by name, ID, or phone..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <FilterPillBar
          ariaLabel="Filter members by loan status"
          options={LOAN_STATUS_FILTERS}
          value={loanFilter}
          onChange={setLoanFilter}
        />
      </div>

      <DataTable<GroupMemberDetail>
        variant="executive"
        caption="Group members"
        data={filteredMembers}
        getRowId={(row) => row.borrowerId}
        columns={[
          {
            id: 'member',
            header: 'Member',
            cell: (row) => (
              <div className="flex items-center gap-wilms-3">
                <Avatar
                  label={row.fullName}
                  photoUrl={resolveEntityPhotoUrl({ name: row.fullName, id: row.borrowerId, photoUrl: row.photoUrl })}
                  size="sm"
                />
                <div>
                  <p className="font-semibold text-text-primary">{row.fullName}</p>
                  <p className="text-small text-text-muted">{row.borrowerId}</p>
                </div>
              </div>
            ),
          },
          { id: 'phone', header: 'Phone', cell: (row) => row.phone },
          {
            id: 'role',
            header: 'Role',
            cell: (row) =>
              row.role === GROUP_MEMBER_ROLE.LEADER ? 'Group leader' : 'Member',
          },
          {
            id: 'status',
            header: 'Status',
            cell: (row) => <StatusBadge status={row.borrowerStatus} />,
          },
          {
            id: 'loanStatus',
            header: 'Current Loan Status',
            cell: (row) => loanStatusLabel(row.loanStatus),
          },
          {
            id: 'outstanding',
            header: 'Outstanding Balance',
            cell: (row) => <CurrencyAmount value={row.outstandingPesewas} />,
          },
          {
            id: 'lastPayment',
            header: 'Last Payment Date',
            cell: (row) =>
              row.lastPaymentDate ? formatDisplayDate(row.lastPaymentDate) : '—',
          },
          {
            id: 'action',
            header: 'Profile',
            cell: (row) => (
              <Link
                href={`/borrowers/${row.borrowerId}`}
                className="text-small font-semibold text-brand-primary hover:underline"
                onClick={(event) => event.stopPropagation()}
              >
                View profile
              </Link>
            ),
          },
        ]}
      />
    </ProfileSection>
  );
}
