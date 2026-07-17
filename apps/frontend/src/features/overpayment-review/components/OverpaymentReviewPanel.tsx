'use client';

import { useState } from 'react';
import { CurrencyAmount, DataTable, KpiCard } from '@/components/data-display';
import { GuidedEmptyState } from '@/components/feedback/GuidedEmptyState';
import { QueryErrorState } from '@/components/feedback/QueryErrorState';
import { InlinePanelSkeleton } from '@/components/feedback/PageSkeletons';
import { EMPTY_STATE_COPY } from '@/constants/empty-state-copy';
import { ExecutiveKpiGrid } from '@/components/layout/executive';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { PERMISSION } from '@/constants/permissions';
import { Button } from '@/components/ui/Button';
import { OverpaymentReviewModal } from '@/features/overpayment-review/components/OverpaymentReviewModal';
import { useOverpaymentReviewActions } from '@/features/overpayment-review/hooks/useOverpaymentReviewActions';
import { useOverpaymentReviews } from '@/features/overpayment-review/hooks/useOverpaymentReviews';
import type { OverpaymentReview } from '@/types/overpayment-review';
import { formatDisplayDate } from '@/utils/format-date';

export type OverpaymentReviewAction = 'RESOLVED' | 'DISMISSED';

export function OverpaymentReviewPanel() {
  const { data, isLoading, isError, error, refetch } = useOverpaymentReviews();
  const { resolveMutation, isSubmitting } = useOverpaymentReviewActions();
  const [selectedReview, setSelectedReview] = useState<OverpaymentReview | null>(null);
  const [reviewAction, setReviewAction] = useState<OverpaymentReviewAction | null>(null);

  const openReview = (review: OverpaymentReview, action: OverpaymentReviewAction) => {
    setSelectedReview(review);
    setReviewAction(action);
  };

  const closeReview = () => {
    setSelectedReview(null);
    setReviewAction(null);
  };

  const handleConfirm = async (note?: string) => {
    if (!selectedReview || !reviewAction) {
      return;
    }

    await resolveMutation.mutateAsync({
      reviewId: selectedReview.id,
      input: { action: reviewAction, note },
    });

    closeReview();
  };

  if (isLoading) {
    return <InlinePanelSkeleton />;
  }

  if (isError) {
    return (
      <QueryErrorState
        error={error}
        onRetry={() => void refetch()}
        title="Unable to load overpayment reviews"
      />
    );
  }

  if (!data) {
    return (
      <QueryErrorState title="Unable to load overpayment reviews" />
    );
  }

  return (
    <section className="space-y-wilms-4">
      <div>
        <h2 className="text-heading-2 font-semibold text-text-primary">Overpayment Review Queue</h2>
        <p className="mt-wilms-1 text-body text-text-muted">
          Blocked overpayment attempts awaiting Super Admin review before any ledger adjustment.
        </p>
      </div>

      <ExecutiveKpiGrid>
        <KpiCard
          variant="executive"
          label="Pending Reviews"
          value={data.pendingCount}
          valueClassName="text-brand-primary"
        />
        <KpiCard variant="executive" label="Queue Items" value={data.reviews.length} />
      </ExecutiveKpiGrid>

      {data.reviews.length === 0 ? (
        <GuidedEmptyState {...EMPTY_STATE_COPY.overpayments} />
      ) : (
        <DataTable<OverpaymentReview>
          variant="executive"
          caption="Pending overpayment reviews"
          data={data.reviews}
          getRowId={(row) => row.id}
          columns={[
            {
              id: 'id',
              header: 'Review ID',
              cell: (row) => <span className="font-semibold text-brand-primary">{row.id}</span>,
            },
            {
              id: 'flaggedAt',
              header: 'Flagged',
              cell: (row) => formatDisplayDate(row.flaggedAt.slice(0, 10)),
            },
            { id: 'borrower', header: 'Borrower', cell: (row) => row.borrowerName },
            {
              id: 'paymentDate',
              header: 'Payment date',
              cell: (row) => formatDisplayDate(row.paymentDate),
            },
            {
              id: 'attempted',
              header: 'Attempted',
              cell: (row) => <CurrencyAmount value={row.attemptedAmountPesewas} />,
            },
            {
              id: 'expected',
              header: 'Expected',
              cell: (row) => <CurrencyAmount value={row.expectedAmountPesewas} />,
            },
            {
              id: 'excess',
              header: 'Excess',
              cell: (row) => <CurrencyAmount value={row.excessPesewas} className="text-danger" />,
            },
            {
              id: 'actions',
              header: 'Actions',
              cell: (row) => (
                <div className="flex flex-wrap gap-wilms-2">
                  <PermissionGate permission={PERMISSION.ACCESS_ADMIN_PORTAL}>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => openReview(row, 'RESOLVED')}
                    >
                      Resolve
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => openReview(row, 'DISMISSED')}
                    >
                      Dismiss
                    </Button>
                  </PermissionGate>
                </div>
              ),
            },
          ]}
        />
      )}

      <OverpaymentReviewModal
        review={selectedReview}
        action={reviewAction}
        isSubmitting={isSubmitting}
        onClose={closeReview}
        onConfirm={handleConfirm}
      />
    </section>
  );
}
