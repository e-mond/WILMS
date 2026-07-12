'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Avatar, DataTable, KpiCard, StatusBadge } from '@/components/data-display';
import {
  ExecutiveKpiGrid,
  FilterDropdown,
  FilterDropdownRow,
  ManagementToolbar,
} from '@/components/layout/executive';
import { GuidedEmptyState } from '@/components/feedback/GuidedEmptyState';
import { QueryErrorState } from '@/components/feedback/QueryErrorState';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { EMPTY_STATE_COPY } from '@/constants/empty-state-copy';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { useQueryLoadingPolicy } from '@/hooks/useQueryLoadingPolicy';
import { PERMISSION } from '@/constants/permissions';
import { Input } from '@/components/ui/Input';
import {
  REGISTRATION_DATE_FILTERS,
  REGISTRATION_WORKFLOW_STATUS,
  REGISTRATION_WORKFLOW_STATUS_LABELS,
  type RegistrationDateFilter,
  type RegistrationWorkflowStatus,
} from '@/constants/registration-workflow';
import {
  buildTabularExportDocument,
  useWilmsExportActor,
  WilmsExportActions,
  WILMS_REPORT_TYPE,
} from '@/features/export';
import { useDeleteRegistration } from '@/features/borrower-registration/hooks/useDeleteRegistration';
import { useMyRegistrations } from '@/features/borrower-registration/hooks/useMyRegistrations';
import { useAuth } from '@/hooks/useAuth';
import type { OfficerRegistrationSummary } from '@/types/borrower';
import { formatDisplayDate } from '@/utils/format-date';
import {
  countRegistrationsByStatus,
  matchesRegistrationDateFilter,
} from '@/utils/registration-workflow.utils';
import { resolveBorrowerDisplayId } from '@/utils/format-borrower-display-id';
import { resolveEntityPhotoUrl } from '@/utils/entity-photo';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  ...Object.values(REGISTRATION_WORKFLOW_STATUS).map((status) => ({
    value: status,
    label: REGISTRATION_WORKFLOW_STATUS_LABELS[status],
  })),
];

function filterRegistrations(
  registrations: OfficerRegistrationSummary[],
  searchQuery: string,
  statusFilter: string,
  dateFilter: RegistrationDateFilter,
): OfficerRegistrationSummary[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return registrations.filter((registration) => {
    const matchesStatus =
      !statusFilter || registration.registrationStatus === statusFilter;
    const matchesDate = matchesRegistrationDateFilter(registration.registeredAt, dateFilter);
    const matchesSearch =
      !normalizedQuery ||
      registration.fullName.toLowerCase().includes(normalizedQuery) ||
      registration.phone.toLowerCase().includes(normalizedQuery) ||
      registration.community.toLowerCase().includes(normalizedQuery) ||
      resolveBorrowerDisplayId(registration).toLowerCase().includes(normalizedQuery);

    return matchesStatus && matchesSearch && matchesDate;
  });
}

function RegistrationStatusBadge({ status }: { status: RegistrationWorkflowStatus }) {
  return (
    <span className="inline-flex rounded-sm border border-border px-wilms-2 py-wilms-1 text-small font-semibold text-text-primary">
      {REGISTRATION_WORKFLOW_STATUS_LABELS[status]}
    </span>
  );
}

export function MyRegistrationsList() {
  const generatedBy = useWilmsExportActor();
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useMyRegistrations(user?.id);
  const { showLoading, isTimedOut } = useQueryLoadingPolicy({ isLoading });
  const deleteMutation = useDeleteRegistration(user?.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<RegistrationDateFilter>('');

  const filteredRegistrations = useMemo(
    () => filterRegistrations(data ?? [], searchQuery, statusFilter, dateFilter),
    [data, searchQuery, statusFilter, dateFilter],
  );

  const statusCounts = useMemo(() => countRegistrationsByStatus(data ?? []), [data]);

  const exportDocument = useMemo(
    () =>
      buildTabularExportDocument({
        reportType: WILMS_REPORT_TYPE.GENERIC_REPORT,
        reportTitle: 'My Registrations',
        generatedBy,
        headers: ['Registration ID', 'Name', 'Phone', 'Community', 'Registration Date', 'Status', 'Photo'],
        rows: filteredRegistrations.map((registration, index) => [
          resolveBorrowerDisplayId(registration, index + 1),
          registration.fullName,
          registration.phone,
          registration.community,
          formatDisplayDate(registration.registeredAt),
          REGISTRATION_WORKFLOW_STATUS_LABELS[registration.registrationStatus],
          registration.photoUrl ? 'Yes' : 'No',
        ]),
      }),
    [filteredRegistrations, generatedBy],
  );

  const handleDelete = async (registration: OfficerRegistrationSummary) => {
    if (!registration.canDelete) {
      return;
    }

    const confirmed = window.confirm(
      `Delete registration for ${registration.fullName}? This cannot be undone.`,
    );

    if (confirmed) {
      await deleteMutation.mutateAsync(registration.id);
    }
  };

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
        title="Unable to load registrations"
      />
    );
  }

  if (!data?.length) {
    return <GuidedEmptyState {...EMPTY_STATE_COPY.registrations} />;
  }

  return (
    <div className="space-y-wilms-4">
      <ExecutiveKpiGrid>
        <KpiCard variant="executive" label="Total Registered" value={data.length} />
        <KpiCard
          variant="executive"
          label="Approved"
          value={statusCounts[REGISTRATION_WORKFLOW_STATUS.APPROVED]}
          valueClassName="text-status-active"
        />
        <KpiCard
          variant="executive"
          label="Pending"
          value={
            statusCounts[REGISTRATION_WORKFLOW_STATUS.SUBMITTED] +
            statusCounts[REGISTRATION_WORKFLOW_STATUS.UNDER_REVIEW]
          }
          valueClassName="text-brand-primary"
        />
        <KpiCard
          variant="executive"
          label="Rejected"
          value={statusCounts[REGISTRATION_WORKFLOW_STATUS.REJECTED]}
          valueClassName="text-danger"
        />
        <KpiCard variant="executive" label="Draft" value={statusCounts[REGISTRATION_WORKFLOW_STATUS.DRAFT]} />
      </ExecutiveKpiGrid>

      <ManagementToolbar
        search={
          <Input
            aria-label="Search registrations"
            placeholder="Search by name, phone, or community"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        }
        filters={
          <FilterDropdownRow>
            <FilterDropdown
              label="Status"
              ariaLabel="Filter registrations by status"
              options={STATUS_FILTERS}
              value={statusFilter}
              onChange={setStatusFilter}
            />
            <FilterDropdown
              label="Date"
              ariaLabel="Filter registrations by date"
              options={REGISTRATION_DATE_FILTERS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              value={dateFilter}
              onChange={(value) => setDateFilter(value as RegistrationDateFilter)}
            />
          </FilterDropdownRow>
        }
        actions={
          <WilmsExportActions
            document={exportDocument}
            filenameBase="my-registrations"
            showIcons
            permissions={[PERMISSION.EXPORT_REPORTS, PERMISSION.REGISTER_BORROWERS]}
          />
        }
      />

      <DataTable
        variant="executive"
        caption="Borrowers registered by the current officer"
        data={filteredRegistrations}
        emptyMessage="No registrations match your search."
        getRowId={(row) => row.id}
        columns={[
          {
            id: 'displayId',
            header: 'Registration ID',
            cell: (row) => (
              <span className="font-mono text-small font-semibold text-text-primary">
                {resolveBorrowerDisplayId(row)}
              </span>
            ),
          },
          {
            id: 'fullName',
            header: 'Borrower',
            cell: (row) => (
              <div className="flex items-center gap-wilms-3">
                <Avatar
                  label={row.fullName}
                  photoUrl={resolveEntityPhotoUrl({ name: row.fullName, id: row.id, photoUrl: row.photoUrl })}
                  size="sm"
                />
                <div>
                  <p className="font-semibold">{row.fullName}</p>
                  <p className="text-small text-text-muted">{row.phone}</p>
                </div>
              </div>
            ),
          },
          {
            id: 'community',
            header: 'Community',
            cell: (row) => row.community,
          },
          {
            id: 'registeredAt',
            header: 'Registration Date',
            cell: (row) => formatDisplayDate(row.registeredAt),
          },
          {
            id: 'status',
            header: 'Status',
            cell: (row) => (
              <div className="space-y-wilms-1">
                <RegistrationStatusBadge status={row.registrationStatus} />
                <StatusBadge status={row.status} />
              </div>
            ),
          },
          {
            id: 'actions',
            header: 'Actions',
            cell: (row) => (
              <div className="flex flex-wrap gap-wilms-2">
                <Link
                  href={
                    'isDraft' in row && row.isDraft
                      ? `/officer/register?edit=${row.id}`
                      : `/officer/my-registrations/${row.id}`
                  }
                  className="text-small font-semibold text-brand-primary hover:underline"
                >
                  View
                </Link>
                {row.canEdit ? (
                  <Link
                    href={`/officer/register?edit=${row.id}`}
                    className="text-small font-semibold text-brand-primary hover:underline"
                  >
                    Edit
                  </Link>
                ) : null}
                {row.canDelete ? (
                  <PermissionGate permission={PERMISSION.EDIT_PENDING_REGISTRATIONS}>
                    <button
                      type="button"
                      className="text-small font-semibold text-danger hover:underline"
                      disabled={deleteMutation.isPending}
                      onClick={() => handleDelete(row)}
                    >
                      Delete
                    </button>
                  </PermissionGate>
                ) : null}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
