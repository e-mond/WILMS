'use client';

import { CurrencyAmount } from '@/components/data-display';
import { DetailSidebarCard } from '@/components/layout/executive';
import { formatDisplayDate } from '@/utils/format-date';

export interface CollectionsAsidePanelProps {
  reportDate: string;
  borrowersDue: number;
  borrowersPaid: number;
  collectedPesewas: number;
  variancePesewas: number;
}

export function CollectionsAsidePanel({
  reportDate,
  borrowersDue,
  borrowersPaid,
  collectedPesewas,
  variancePesewas,
}: CollectionsAsidePanelProps) {
  return (
    <>
      <DetailSidebarCard title="Collection Summary">
        <dl className="mt-wilms-3 space-y-wilms-2 text-small">
          <div>
            <dt className="text-text-muted">Report date</dt>
            <dd className="font-semibold">{formatDisplayDate(reportDate)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Borrowers due</dt>
            <dd className="font-semibold">{borrowersDue}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Borrowers paid</dt>
            <dd className="font-semibold text-status-active">{borrowersPaid}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Collected</dt>
            <dd className="font-semibold">
              <CurrencyAmount value={collectedPesewas} />
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Variance</dt>
            <dd className={variancePesewas === 0 ? 'font-semibold text-status-active' : 'font-semibold text-danger'}>
              <CurrencyAmount value={Math.abs(variancePesewas)} />
            </dd>
          </div>
        </dl>
      </DetailSidebarCard>
      <DetailSidebarCard title="Reconciliation Notes">
        <p className="mt-wilms-3 text-small text-text-muted">
          Compare collector totals against GPS-verified receipts before closing the daily collection
          report.
        </p>
      </DetailSidebarCard>
    </>
  );
}
