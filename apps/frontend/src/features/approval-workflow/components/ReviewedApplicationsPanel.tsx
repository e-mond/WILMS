'use client';

import { useMemo, useState } from 'react';
import { DataTable, KpiCard } from '@/components/data-display';
import { ExecutiveKpiGrid, ManagementToolbar } from '@/components/layout/executive';
import { GuidedEmptyState } from '@/components/feedback/GuidedEmptyState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { CONNECTION_ERROR_COPY, EMPTY_STATE_COPY } from '@/constants/empty-state-copy';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { Input } from '@/components/ui/Input';
import {
  REVIEWED_DECISION_BADGE_CLASS,
  REVIEWED_DECISION_LABELS,
} from '@/constants/reviewed-decision-display';
import { useReviewedApplications } from '@/features/approval-workflow/hooks/useReviewedApplications';
import type { ReviewedApplicationSummary } from '@/types/approval';
import { formatDisplayDate } from '@/utils/format-date';
import { cn } from '@/utils/cn';

function filterReviewedApplications(
  applications: ReviewedApplicationSummary[],
  searchQuery: string,
): ReviewedApplicationSummary[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  if (!normalizedQuery) {
    return applications;
  }

  return applications.filter(
    (application) =>
      application.borrowerName.toLowerCase().includes(normalizedQuery) ||
      application.community.toLowerCase().includes(normalizedQuery) ||
      REVIEWED_DECISION_LABELS[application.decision].toLowerCase().includes(normalizedQuery),
  );
}

export function ReviewedApplicationsPanel() {
  const { data, isLoading, isError } = useReviewedApplications();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredApplications = useMemo(
    () => filterReviewedApplications(data ?? [], searchQuery),
    [data, searchQuery],
  );

  if (isLoading) {
    return <LoadingSpinner label="Loading reviewed applications" className="py-wilms-8" />;
  }

  if (isError) {
    return <EmptyState {...CONNECTION_ERROR_COPY} />;
  }

  if (!data?.length) {
    return <GuidedEmptyState {...EMPTY_STATE_COPY.reviewedApplications} />;
  }

  return (
    <div className="space-y-wilms-4">
      <ExecutiveKpiGrid>
        <KpiCard variant="executive" label="Reviewed Applications" value={data.length} />
        <KpiCard variant="executive" label="Showing" value={filteredApplications.length} />
      </ExecutiveKpiGrid>

      <ManagementToolbar
        search={
          <Input
            aria-label="Search reviewed applications"
            placeholder="Search by name, community, or decision"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        }
      />

      <DataTable<ReviewedApplicationSummary>
        variant="executive"
        layout="auto"
        caption="Reviewed borrower applications"
        data={filteredApplications}
        emptyMessage="No applications match your search."
        getRowId={(row) => `${row.borrowerId}-${row.reviewedAt}`}
        columns={[
          {
            id: 'borrower',
            header: 'Borrower name',
            cell: (row) => (
              <span className="block max-w-[14rem] truncate" title={row.borrowerName}>
                {row.borrowerName}
              </span>
            ),
            className: 'min-w-[10rem] whitespace-nowrap',
          },
          {
            id: 'reviewedBy',
            header: 'Reviewed by',
            cell: (row) => row.reviewedBy ?? '—',
            className: 'min-w-[8rem] whitespace-nowrap',
          },
          {
            id: 'reviewedAt',
            header: 'Review date',
            cell: (row) => formatDisplayDate(row.reviewedAt.slice(0, 10)),
            className: 'whitespace-nowrap',
          },
          {
            id: 'status',
            header: 'Status',
            cell: (row) => row.status ?? '—',
            className: 'whitespace-nowrap',
          },
          {
            id: 'decision',
            header: 'Decision',
            cell: (row) => (
              <span
                className={cn(
                  'inline-flex whitespace-nowrap rounded-sm px-wilms-2 py-wilms-1 text-small font-semibold',
                  REVIEWED_DECISION_BADGE_CLASS[row.decision],
                )}
              >
                {REVIEWED_DECISION_LABELS[row.decision]}
              </span>
            ),
          },
          { id: 'community', header: 'Community', cell: (row) => row.community },
          {
            id: 'reason',
            header: 'Comments',
            cell: (row) => row.reason ?? '—',
            className: 'min-w-[12rem]',
          },
        ]}
      />
    </div>
  );
}
