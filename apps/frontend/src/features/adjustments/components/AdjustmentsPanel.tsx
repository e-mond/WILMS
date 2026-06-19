'use client';

import { useState } from 'react';
import { CurrencyAmount, DataTable, KpiCard } from '@/components/data-display';
import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { ExecutiveKpiGrid } from '@/components/layout/executive';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { PERMISSION } from '@/constants/permissions';
import { Button } from '@/components/ui/Button';
import { ADJUSTMENT_TYPE_LABELS } from '@/constants/adjustment-display';
import {
  AdjustmentReviewModal,
  type AdjustmentReviewAction,
} from '@/features/adjustments/components/AdjustmentReviewModal';
import { useAdjustmentActions } from '@/features/adjustments/hooks/useAdjustmentActions';
import { useAdjustments } from '@/features/adjustments/hooks/useAdjustments';
import type { AdjustmentRequest } from '@/types/adjustment';
import { formatDisplayDate } from '@/utils/format-date';

export function AdjustmentsPanel() {
  const { data, isLoading, isError } = useAdjustments();
  const { approveMutation, rejectMutation, isSubmitting } = useAdjustmentActions();
  const [selectedRequest, setSelectedRequest] = useState<AdjustmentRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<AdjustmentReviewAction | null>(null);

  const openReview = (request: AdjustmentRequest, action: AdjustmentReviewAction) => {
    setSelectedRequest(request);
    setReviewAction(action);
  };

  const closeReview = () => {
    setSelectedRequest(null);
    setReviewAction(null);
  };

  const handleConfirm = async (reason?: string) => {
    if (!selectedRequest || !reviewAction) {
      return;
    }

    if (reviewAction === 'approve') {
      await approveMutation.mutateAsync(selectedRequest.id);
    } else {
      await rejectMutation.mutateAsync({
        adjustmentId: selectedRequest.id,
        input: { reason: reason ?? '' },
      });
    }

    closeReview();
  };

  if (isLoading) {
    return <LoadingSpinner label="Loading adjustment queue" className="py-wilms-8" />;
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Unable to load adjustments"
        description="Check your connection and try again."
      />
    );
  }

  return (
    <div className="space-y-wilms-4">
      <ExecutiveKpiGrid>
        <KpiCard
          variant="executive"
          label="Pending Approvals"
          value={data.pendingCount}
          valueClassName="text-brand-primary"
        />
        <KpiCard variant="executive" label="Queue Items" value={data.requests.length} />
      </ExecutiveKpiGrid>

      {data.requests.length === 0 ? (
        <EmptyState
          title="No pending adjustments"
          description="All correction requests have been reviewed."
        />
      ) : (
        <DataTable<AdjustmentRequest>
          variant="executive"
          caption="Pending adjustment requests"
          data={data.requests}
          getRowId={(row) => row.id}
          columns={[
            {
              id: 'id',
              header: 'Request ID',
              cell: (row) => <span className="font-semibold text-brand-primary">{row.id}</span>,
            },
            {
              id: 'requestedAt',
              header: 'Requested',
              cell: (row) => formatDisplayDate(row.requestedAt.slice(0, 10)),
            },
            { id: 'borrower', header: 'Borrower', cell: (row) => row.borrowerName },
            {
              id: 'type',
              header: 'Type',
              cell: (row) => ADJUSTMENT_TYPE_LABELS[row.type],
            },
            {
              id: 'amount',
              header: 'Amount',
              cell: (row) => <CurrencyAmount value={row.amountPesewas} />,
            },
            { id: 'requestedBy', header: 'Requested by', cell: (row) => row.requestedBy },
            { id: 'reason', header: 'Reason', cell: (row) => row.reason },
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
                      onClick={() => openReview(row, 'approve')}
                    >
                      Approve
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => openReview(row, 'reject')}
                    >
                      Reject
                    </Button>
                  </PermissionGate>
                </div>
              ),
            },
          ]}
        />
      )}

      <AdjustmentReviewModal
        request={selectedRequest}
        action={reviewAction}
        isSubmitting={isSubmitting}
        onClose={closeReview}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
