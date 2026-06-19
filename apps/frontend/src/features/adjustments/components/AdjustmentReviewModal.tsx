'use client';

import { useState } from 'react';
import { CurrencyAmount } from '@/components/data-display';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { ADJUSTMENT_TYPE_LABELS } from '@/constants/adjustment-display';
import { adjustmentReasonSchema } from '@/features/adjustments/adjustment.schema';
import type { AdjustmentRequest } from '@/types/adjustment';

export type AdjustmentReviewAction = 'approve' | 'reject';

const MODAL_COPY: Record<
  AdjustmentReviewAction,
  { title: string; description: string; confirmLabel: string; variant: 'primary' | 'danger' }
> = {
  approve: {
    title: 'Approve adjustment',
    description:
      'This will post an adjustment to the financial ledger. Write-offs also blacklist the borrower.',
    confirmLabel: 'Approve',
    variant: 'primary',
  },
  reject: {
    title: 'Reject adjustment',
    description: 'Provide a reason. The requester will be notified to resubmit if needed.',
    confirmLabel: 'Reject',
    variant: 'danger',
  },
};

export interface AdjustmentReviewModalProps {
  request: AdjustmentRequest | null;
  action: AdjustmentReviewAction | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<void>;
}

export function AdjustmentReviewModal({
  request,
  action,
  isSubmitting,
  onClose,
  onConfirm,
}: AdjustmentReviewModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!request || !action) {
    return null;
  }

  const copy = MODAL_COPY[action];
  const requiresReason = action === 'reject';

  const handleConfirm = async () => {
    setError(null);

    if (requiresReason) {
      const parsed = adjustmentReasonSchema.safeParse({ reason });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? 'A reason is required.');
        return;
      }

      await onConfirm(parsed.data.reason);
      setReason('');
      return;
    }

    await onConfirm();
  };

  const handleClose = () => {
    setReason('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen
      title={copy.title}
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="secondary" disabled={isSubmitting} onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={copy.variant}
            disabled={isSubmitting}
            onClick={() => void handleConfirm()}
          >
            {isSubmitting ? 'Saving...' : copy.confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-wilms-4 text-body text-text-muted">
        <p>{copy.description}</p>
        <dl className="grid gap-wilms-2 rounded-sm border border-border bg-background p-wilms-3">
          <div>
            <dt className="text-small font-semibold">Borrower</dt>
            <dd className="text-text-primary">{request.borrowerName}</dd>
          </div>
          <div>
            <dt className="text-small font-semibold">Type</dt>
            <dd className="text-text-primary">{ADJUSTMENT_TYPE_LABELS[request.type]}</dd>
          </div>
          <div>
            <dt className="text-small font-semibold">Amount</dt>
            <dd className="text-text-primary">
              <CurrencyAmount value={request.amountPesewas} />
            </dd>
          </div>
          <div>
            <dt className="text-small font-semibold">Original reason</dt>
            <dd className="text-text-primary">{request.reason}</dd>
          </div>
        </dl>
        {requiresReason ? (
          <div className="space-y-wilms-2">
            <label htmlFor="adjustment-reject-reason" className="text-small font-semibold text-text-primary">
              Rejection reason
            </label>
            <Textarea
              id="adjustment-reject-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Explain why this adjustment is rejected"
            />
            {error ? <p className="text-small text-danger">{error}</p> : null}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
