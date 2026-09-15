'use client';

import Link from 'next/link';
import { ClipboardCheck, FileSearch, HandCoins } from 'lucide-react';
import { DetailSidebarCard } from '@/components/layout/executive';

export interface ApplicationsAsidePanelProps {
  pendingCount: number;
  totalSubmitted: number;
}

export function ApplicationsAsidePanel({
  pendingCount,
  totalSubmitted,
}: ApplicationsAsidePanelProps) {
  const reviewedHint = Math.max(0, totalSubmitted - pendingCount);

  return (
    <>
      <DetailSidebarCard
        title="Application queue"
        subtitle="Pending KYC and registration reviews"
      >
        <dl className="mt-wilms-3 space-y-wilms-3 text-small">
          <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-100 bg-amber-50/70 px-3 py-2 dark:border-amber-900/40 dark:bg-amber-950/30">
            <dt className="font-medium text-text-muted">Awaiting review</dt>
            <dd className="text-heading-3 font-semibold tabular-nums text-amber-700 dark:text-amber-400">
              {pendingCount}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">In directory</dt>
            <dd className="font-semibold tabular-nums">{totalSubmitted}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Already decided</dt>
            <dd className="font-semibold tabular-nums">{reviewedHint}</dd>
          </div>
        </dl>
      </DetailSidebarCard>

      <DetailSidebarCard title="Review checklist">
        <ul className="mt-wilms-3 space-y-wilms-3 text-small text-text-muted">
          <li className="flex items-start gap-2">
            <FileSearch className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" aria-hidden="true" />
            <span>Open the profile to verify identity photos, guarantor, and contact details.</span>
          </li>
          <li className="flex items-start gap-2">
            <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" aria-hidden="true" />
            <span>Confirm group assignment before approving the application.</span>
          </li>
          <li className="flex items-start gap-2">
            <HandCoins className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" aria-hidden="true" />
            <span>
              After approval, create a loan from{' '}
              <Link href="/loans/new" className="font-semibold text-brand-primary hover:underline">
                New loan
              </Link>
              .
            </span>
          </li>
        </ul>
      </DetailSidebarCard>
    </>
  );
}
