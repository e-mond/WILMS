'use client';

import { DetailSidebarCard } from '@/components/layout/executive';

export interface BorrowersAsidePanelProps {
  totalBorrowers: number;
  approvedCount: number;
  atRiskCount: number;
}

export function BorrowersAsidePanel({
  totalBorrowers,
  approvedCount,
  atRiskCount,
}: BorrowersAsidePanelProps) {
  return (
    <>
      <DetailSidebarCard title="Borrower Directory Summary">
        <dl className="mt-wilms-3 space-y-wilms-2 text-small">
          <div className="flex justify-between">
            <dt className="text-text-muted">Total borrowers</dt>
            <dd className="font-semibold">{totalBorrowers}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Approved</dt>
            <dd className="font-semibold text-status-active">{approvedCount}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">At risk / defaulted</dt>
            <dd className="font-semibold text-danger">{atRiskCount}</dd>
          </div>
        </dl>
      </DetailSidebarCard>
      <DetailSidebarCard title="Quick Actions">
        <ul className="mt-wilms-3 space-y-wilms-2 text-small text-text-muted">
          <li>Use status filters to review pending applications.</li>
          <li>Export the directory for field verification visits.</li>
          <li>Open a borrower profile for loan and payment history.</li>
        </ul>
      </DetailSidebarCard>
    </>
  );
}
