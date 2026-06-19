'use client';

import { CurrencyAmount } from '@/components/data-display';
import { DetailSidebarCard } from '@/components/layout/executive';

export interface DisbursementsAsidePanelProps {
  totalLoans: number;
  activeLoans: number;
  totalDisbursedPesewas: number;
  totalOutstandingPesewas: number;
}

export function DisbursementsAsidePanel({
  totalLoans,
  activeLoans,
  totalDisbursedPesewas,
  totalOutstandingPesewas,
}: DisbursementsAsidePanelProps) {
  return (
    <>
      <DetailSidebarCard title="Disbursement Summary">
        <dl className="mt-wilms-3 space-y-wilms-2 text-small">
          <div className="flex justify-between">
            <dt className="text-text-muted">Total loans</dt>
            <dd className="font-semibold">{totalLoans}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Active</dt>
            <dd className="font-semibold">{activeLoans}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Disbursed</dt>
            <dd className="font-semibold">
              <CurrencyAmount value={totalDisbursedPesewas} />
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Outstanding</dt>
            <dd className="font-semibold text-danger">
              <CurrencyAmount value={totalOutstandingPesewas} />
            </dd>
          </div>
        </dl>
      </DetailSidebarCard>
      <DetailSidebarCard title="Portfolio Notes">
        <p className="mt-wilms-3 text-small text-text-muted">
          Filter by cycle batch or status to review disbursement performance before collections
          reconciliation.
        </p>
      </DetailSidebarCard>
    </>
  );
}
