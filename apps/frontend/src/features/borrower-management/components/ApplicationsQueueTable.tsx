'use client';

import Link from 'next/link';
import { ArrowRight, ClipboardList } from 'lucide-react';
import { Avatar, StatusBadge } from '@/components/data-display';
import type { BorrowerSummary } from '@/types/borrower';
import { resolveBorrowerDisplayId } from '@/utils/format-borrower-display-id';
import { resolveEntityPhotoUrl } from '@/utils/entity-photo';
import { cn } from '@/utils/cn';

export interface ApplicationsQueueTableProps {
  applications: BorrowerSummary[];
  totalCount: number;
}

export function ApplicationsQueueTable({
  applications,
  totalCount,
}: ApplicationsQueueTableProps) {
  return (
    <div className="space-y-wilms-3" data-testid="applications-queue-table">
      <div className="flex items-center justify-between gap-wilms-3">
        <div className="flex items-center gap-wilms-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-400">
            <ClipboardList className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-heading-3 font-semibold text-text-primary">Pending applications</h2>
            <p className="text-small text-text-muted">
              Review KYC, group assignment, and readiness for loan creation
            </p>
          </div>
        </div>
        <p className="shrink-0 text-small text-text-muted">
          {applications.length} of {totalCount}
        </p>
      </div>

      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {applications.map((row, index) => (
          <li
            key={row.id}
            className={cn(
              'flex flex-col gap-wilms-3 px-wilms-4 py-wilms-4 transition-colors hover:bg-background/80 sm:flex-row sm:items-center sm:justify-between',
              index === 0 && 'rounded-t-xl',
              index === applications.length - 1 && 'rounded-b-xl',
            )}
          >
            <div className="flex min-w-0 items-start gap-wilms-3 sm:items-center">
              <Avatar
                label={row.fullName}
                photoUrl={resolveEntityPhotoUrl({
                  name: row.fullName,
                  id: row.id,
                  photoUrl: row.photoUrl,
                })}
                size="md"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-wilms-2">
                  <p className="truncate text-body font-semibold text-text-primary">{row.fullName}</p>
                  <StatusBadge status={row.status} />
                </div>
                <p className="mt-0.5 text-small text-text-muted">{row.phone}</p>
                <dl className="mt-wilms-2 flex flex-wrap gap-x-wilms-4 gap-y-1 text-small">
                  <div className="flex gap-1.5">
                    <dt className="text-text-muted">ID</dt>
                    <dd className="font-semibold text-brand-primary">
                      {resolveBorrowerDisplayId(row)}
                    </dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className="text-text-muted">Group</dt>
                    <dd className="font-semibold text-text-primary">
                      {row.groupId ? (
                        <Link
                          href={`/groups/${row.groupId}`}
                          className="text-brand-primary hover:underline"
                        >
                          {row.groupName}
                        </Link>
                      ) : (
                        row.groupName || 'Unassigned'
                      )}
                    </dd>
                  </div>
                  {row.community ? (
                    <div className="flex gap-1.5">
                      <dt className="text-text-muted">Community</dt>
                      <dd className="font-semibold text-text-primary">{row.community}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-wilms-2 sm:pl-wilms-4">
              <Link
                href={`/borrowers/${row.id}`}
                className="inline-flex h-8 min-w-[7.5rem] items-center justify-center rounded-sm border border-brand-primary bg-brand-primary px-wilms-3 text-small font-semibold text-card hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
              >
                Review
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
