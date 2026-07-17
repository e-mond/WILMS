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
  reconciliationSubmittedCount?: number;
  reconciliationApprovedCount?: number;
  reconciliationUnderReviewCount?: number;
}

export function CollectionsAsidePanel({
  reportDate,
  borrowersDue,
  borrowersPaid,
  expectedPesewas,
  collectedPesewas,
  variancePesewas,
  reconciliationSubmittedCount = 0,
  reconciliationApprovedCount = 0,
  reconciliationUnderReviewCount = 0,
}: CollectionsAsidePanelProps) {
  const varianceLabel =
    variancePesewas === 0
      ? 'Balanced'
      : variancePesewas > 0
        ? 'Above expected'
        : 'Below expected';

  const reconciliationStatusLabel =
    reconciliationSubmittedCount === 0
      ? 'No submissions yet'
      : reconciliationUnderReviewCount > 0
        ? `${reconciliationUnderReviewCount} pending`
        : `${reconciliationApprovedCount} approved`;

  return (
    <>
      <DetailSidebarCard title="Collection Summary">
        <dl className="mt-wilms-3 space-y-wilms-2 text-small">
          <div>
            <dt className="text-text-muted">Report date</dt>
            <dd className="font-semibold">{formatDisplayDate(reportDate)}</dd>
          </div>
          <div className="flex justify-between gap-wilms-2">
            <dt className="text-text-muted">Borrowers due</dt>
            <dd className="shrink-0 font-semibold tabular-nums">{borrowersDue}</dd>
          </div>
          <div className="flex justify-between gap-wilms-2">
            <dt className="text-text-muted">Borrowers paid</dt>
            <dd className="shrink-0 font-semibold text-status-active tabular-nums">{borrowersPaid}</dd>
          </div>
          <div className="flex justify-between gap-wilms-2">
            <dt className="min-w-0 text-text-muted">Expected</dt>
            <dd className="shrink-0 font-semibold">
              <CurrencyAmount value={expectedPesewas} className="whitespace-nowrap tabular-nums" />
            </dd>
          </div>
          <div className="flex justify-between gap-wilms-2">
            <dt className="min-w-0 text-text-muted">Collected</dt>
            <dd className="shrink-0 font-semibold">
              <CurrencyAmount value={collectedPesewas} className="whitespace-nowrap tabular-nums" />
            </dd>
          </div>
          <div className="flex justify-between gap-wilms-2">
            <dt className="min-w-0 truncate text-text-muted">Variance ({varianceLabel})</dt>
            <dd
              className={
                variancePesewas === 0
                  ? 'shrink-0 font-semibold text-status-active'
                  : variancePesewas > 0
                    ? 'shrink-0 font-semibold text-brand-primary'
                    : 'shrink-0 font-semibold text-danger'
              }
            >
              {variancePesewas === 0 ? (
                '—'
              ) : (
                <CurrencyAmount value={Math.abs(variancePesewas)} className="whitespace-nowrap tabular-nums" />
              )}
            </dd>
          </div>
        </dl>
      </DetailSidebarCard>

      <DetailSidebarCard title="Reconciliation Status">
        <dl className="mt-wilms-3 space-y-wilms-2 text-small">
          <div className="flex justify-between gap-wilms-2">
            <dt className="text-text-muted">Submitted</dt>
            <dd className="shrink-0 font-semibold tabular-nums">{reconciliationSubmittedCount}</dd>
          </div>
          <div className="flex justify-between gap-wilms-2">
            <dt className="text-text-muted">Approved</dt>
            <dd className="shrink-0 font-semibold text-status-active tabular-nums">
              {reconciliationApprovedCount}
            </dd>
          </div>
          <div className="flex justify-between gap-wilms-2">
            <dt className="text-text-muted">Status</dt>
            <dd
              className={
                reconciliationUnderReviewCount > 0
                  ? 'shrink-0 text-right font-semibold text-status-at-risk'
                  : reconciliationSubmittedCount > 0
                    ? 'shrink-0 text-right font-semibold text-status-active'
                    : 'shrink-0 text-right font-semibold text-text-muted'
              }
            >
              {reconciliationStatusLabel}
            </dd>
          </div>
        </dl>
      </DetailSidebarCard>

      <DetailSidebarCard title="Reconciliation Notes">
        <p className="mt-wilms-3 text-small leading-relaxed text-text-muted">
          Variance is calculated as collected minus expected for borrowers due on the report date.
          {variancePesewas !== 0
            ? ` ${varianceLabel} by ${Math.abs(variancePesewas / 100).toFixed(2)} GHS — review flagged reconciliations before closing.`
            : ' Totals match expected collections for due borrowers.'}
          {reconciliationUnderReviewCount > 0
            ? ` ${reconciliationUnderReviewCount} collector reconciliation(s) for this date still need review.`
            : reconciliationSubmittedCount > 0
              ? ' All submitted reconciliations for this date are approved.'
              : ''}
        </p>
      </DetailSidebarCard>
    </>
  );
}
