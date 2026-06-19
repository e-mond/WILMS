'use client';

import { DetailSidebarCard } from '@/components/layout/executive';

export interface ApplicationsAsidePanelProps {
  pendingCount: number;
  totalSubmitted: number;
}

export function ApplicationsAsidePanel({
  pendingCount,
  totalSubmitted,
}: ApplicationsAsidePanelProps) {
  return (
    <>
      <DetailSidebarCard title="Application Queue">
        <dl className="mt-wilms-3 space-y-wilms-2 text-small">
          <div className="flex justify-between">
            <dt className="text-text-muted">Pending review</dt>
            <dd className="font-semibold text-executive-gold">{pendingCount}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Total in directory</dt>
            <dd className="font-semibold">{totalSubmitted}</dd>
          </div>
        </dl>
      </DetailSidebarCard>
      <DetailSidebarCard title="Review Actions">
        <ul className="mt-wilms-3 space-y-wilms-2 text-small text-text-muted">
          <li>Open a borrower profile to verify KYC and group assignment.</li>
          <li>Export pending applications for approver sign-off.</li>
          <li>Route approved borrowers to loan disbursement.</li>
        </ul>
      </DetailSidebarCard>
    </>
  );
}
