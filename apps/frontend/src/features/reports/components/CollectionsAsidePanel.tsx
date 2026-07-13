'use client';

import { CurrencyAmount } from '@/components/data-display';
import { DetailSidebarCard } from '@/components/layout/executive';
import { formatDisplayDate } from '@/utils/format-date';

export interface CollectionsAsidePanelProps {
  reportDate: string;
  borrowersDue: number;
  borrowersPaid: number;
  expectedPesewas: number;
  collectedPesewas: number;
  variancePesewas: number;
}

export function CollectionsAsidePanel({
  reportDate,
  borrowersDue,
  borrowersPaid,
  expectedPesewas,
  collectedPesewas,
  variancePesewas,
}: CollectionsAsidePanelProps) {
  const varianceLabel =
    variancePesewas === 0
      ? 'Balanced'
      : variancePesewas > 0
        ? 'Above expected'
        : 'Below expected';

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
            <dt className="text-text-muted">Expected</dt>
            <dd className="font-semibold">
              <CurrencyAmount value={expectedPesewas} />
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Collected</dt>
            <dd className="font-semibold">
              <CurrencyAmount value={collectedPesewas} />
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Variance ({varianceLabel})</dt>
            <dd
              className={
                variancePesewas === 0
                  ? 'font-semibold text-status-active'
                  : variancePesewas > 0
                    ? 'font-semibold text-brand-primary'
                    : 'font-semibold text-danger'
              }
            >
              {variancePesewas === 0 ? (
                '—'
              ) : (
                <CurrencyAmount value={Math.abs(variancePesewas)} />
              )}
            </dd>
          </div>
        </dl>
      </DetailSidebarCard>
      <DetailSidebarCard title="Reconciliation Notes">
        <p className="mt-wilms-3 text-small text-text-muted">
          Variance is calculated as collected minus expected for borrowers due on the report date.
          {variancePesewas !== 0
            ? ` ${varianceLabel} by ${Math.abs(variancePesewas / 100).toFixed(2)} GHS — review flagged reconciliations before closing.`
            : ' Totals match expected collections for due borrowers.'}
        </p>
      </DetailSidebarCard>
    </>
  );
}
