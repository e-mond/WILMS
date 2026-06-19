'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DataTable, KpiCard, StatusBadge } from '@/components/data-display';
import { ExecutiveKpiGrid, ManagementToolbar } from '@/components/layout/executive';
import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { Input } from '@/components/ui/Input';
import { usePendingApplications } from '@/features/approval-workflow/hooks/usePendingApplications';
import { groupPendingApplicationsByCommunityAndDate } from '@/utils/approval-queue-grouping';
import { BORROWER_STATUS } from '@/types/borrower';
import type { PendingApplicationSummary } from '@/types/borrower';

function filterPendingApplications(
  applications: PendingApplicationSummary[],
  searchQuery: string,
): PendingApplicationSummary[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  if (!normalizedQuery) {
    return applications;
  }

  return applications.filter(
    (application) =>
      application.fullName.toLowerCase().includes(normalizedQuery) ||
      application.phone.toLowerCase().includes(normalizedQuery) ||
      application.community.toLowerCase().includes(normalizedQuery) ||
      application.registeredByOfficerName.toLowerCase().includes(normalizedQuery),
  );
}

export function PendingApplicationsQueue() {
  const { data, isLoading, isError } = usePendingApplications();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCommunities, setExpandedCommunities] = useState<Record<string, boolean>>({});

  const filteredApplications = useMemo(
    () => filterPendingApplications(data ?? [], searchQuery),
    [data, searchQuery],
  );

  const groupedApplications = useMemo(
    () => groupPendingApplicationsByCommunityAndDate(filteredApplications),
    [filteredApplications],
  );

  if (isLoading) {
    return <LoadingSpinner label="Loading pending applications" className="py-wilms-8" />;
  }

  if (isError) {
    return (
      <EmptyState
        title="Unable to load pending applications"
        description="Check your connection and try again."
      />
    );
  }

  if (!data?.length) {
    return (
      <EmptyState
        title="No pending applications"
        description="New borrower registrations will appear here for your review."
      />
    );
  }

  return (
    <div className="space-y-wilms-4">
      <ExecutiveKpiGrid>
        <KpiCard
          variant="executive"
          label="Pending Applications"
          value={data.length}
          valueClassName="text-brand-primary"
        />
        <KpiCard variant="executive" label="Showing" value={filteredApplications.length} />
        <KpiCard variant="executive" label="Communities" value={groupedApplications.length} />
      </ExecutiveKpiGrid>

      <ManagementToolbar
        search={
          <Input
            type="search"
            aria-label="Search pending applications"
            placeholder="Search by name, phone, community, or officer"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        }
      />

      <div className="space-y-wilms-3">
        {groupedApplications.map((communityGroup) => {
          const isExpanded = expandedCommunities[communityGroup.community] ?? true;

          return (
            <section
              key={communityGroup.community}
              className="overflow-hidden rounded-sm border border-border bg-card"
            >
              <button
                type="button"
                className="flex w-full min-h-[44px] items-center justify-between gap-wilms-3 px-wilms-4 py-wilms-3 text-left"
                aria-expanded={isExpanded}
                onClick={() =>
                  setExpandedCommunities((current) => ({
                    ...current,
                    [communityGroup.community]: !isExpanded,
                  }))
                }
              >
                <div>
                  <p className="text-body font-semibold text-text-primary">{communityGroup.community}</p>
                  <p className="text-small text-text-muted">
                    {communityGroup.totalApplications} pending application
                    {communityGroup.totalApplications === 1 ? '' : 's'}
                  </p>
                </div>
                <span className="text-small font-semibold text-brand-primary">
                  {isExpanded ? 'Hide' : 'Show'}
                </span>
              </button>

              {isExpanded ? (
                <div className="space-y-wilms-4 border-t border-border px-wilms-4 py-wilms-4">
                  {communityGroup.dateGroups.map((dateGroup) => (
                    <div key={`${communityGroup.community}-${dateGroup.dateLabel}`}>
                      <h3 className="mb-wilms-2 text-small font-semibold uppercase tracking-wide text-text-muted">
                        {dateGroup.dateLabel}
                      </h3>
                      <DataTable
                        variant="executive"
                        caption={`Pending applications in ${communityGroup.community} on ${dateGroup.dateLabel}`}
                        data={dateGroup.applications}
                        emptyMessage="No applications for this date."
                        getRowId={(row) => row.id}
                        columns={[
                          {
                            id: 'fullName',
                            header: 'Applicant',
                            cell: (row) => (
                              <div>
                                <p className="font-semibold">{row.fullName}</p>
                                <p className="text-small text-text-muted">{row.phone}</p>
                              </div>
                            ),
                          },
                          {
                            id: 'registeredByOfficerName',
                            header: 'Registered by',
                            cell: (row) => row.registeredByOfficerName,
                          },
                          {
                            id: 'status',
                            header: 'Status',
                            cell: () => <StatusBadge status={BORROWER_STATUS.PENDING} />,
                          },
                          {
                            id: 'actions',
                            header: 'Action',
                            cell: (row) => (
                              <Link
                                href={`/approver/pending/${row.id}`}
                                className="font-semibold text-brand-primary hover:underline"
                              >
                                Review
                              </Link>
                            ),
                          },
                        ]}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>

      {filteredApplications.length === 0 ? (
        <EmptyState
          title="No applications match your search"
          description="Try a different name, phone number, community, or officer."
        />
      ) : null}
    </div>
  );
}
