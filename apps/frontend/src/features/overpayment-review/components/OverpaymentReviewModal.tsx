'use client';

import { useState } from 'react';
import { CurrencyAmount } from '@/components/data-display';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import type { OverpaymentReviewAction } from '@/features/overpayment-review/components/OverpaymentReviewPanel';
import type { OverpaymentReview } from '@/types/overpayment-review';
import { formatDisplayDate } from '@/utils/format-date';

const MODAL_COPY: Record<
  OverpaymentReviewAction,
  { title: string; description: string; confirmLabel: string; variant: 'primary' | 'secondary' }
> = {
  RESOLVED: {
    title: 'Resolve overpayment review',
    description:
      'Confirm this overpayment has been reviewed. Record an adjustment separately if the ledger must change.',
    confirmLabel: 'Mark resolved',
    variant: 'primary',
  },
  DISMISSED: {
    title: 'Dismiss overpayment review',
    description: 'Dismiss when the blocked attempt was a data entry error or false alarm.',
    confirmLabel: 'Dismiss review',
    variant: 'secondary',
  },
};

export interface OverpaymentReviewModalProps {
  review: OverpaymentReview | null;
  action: OverpaymentReviewAction | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (note?: string) => Promise<void>;
}

export function OverpaymentReviewModal({
  review,
  action,
  isSubmitting,
  onClose,
  onConfirm,
}: OverpaymentReviewModalProps) {
  const [note, setNote] = useState('');

  if (!review || !action) {
    return null;
  }

  const copy = MODAL_COPY[action];

  const handleConfirm = async () => {
    await onConfirm(note.trim() || undefined);
    setNote('');
  };

  const handleClose = () => {
    setNote('');
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
            aria-label={`Confirm ${copy.confirmLabel.toLowerCase()}`}
            onClick={() => void handleConfirm()}
          >
            {isSubmitting ? 'Saving...' : copy.confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-body text-text-muted">{copy.description}</p>
      <dl className="mt-wilms-4 grid gap-wilms-3 text-body sm:grid-cols-2">
        <div>
          <dt className="text-small font-semibold text-text-muted">Borrower</dt>
          <dd className="text-text-primary">{review.borrowerName}</dd>
        </div>
        <div>
          <dt className="text-small font-semibold text-text-muted">Payment date</dt>
          <dd className="text-text-primary">{formatDisplayDate(review.paymentDate)}</dd>
        </div>
        <div>
          <dt className="text-small font-semibold text-text-muted">Attempted amount</dt>
          <dd>
            <CurrencyAmount value={review.attemptedAmountPesewas} />
          </dd>
        </div>
        <div>
          <dt className="text-small font-semibold text-text-muted">Expected amount</dt>
          <dd>
            <CurrencyAmount value={review.expectedAmountPesewas} />
          </dd>
        </div>
      </dl>
      <div className="mt-wilms-4">
        <label htmlFor="overpayment-review-note" className="text-small font-semibold text-text-primary">
          Review note (optional)
        </label>
        <Textarea
          id="overpayment-review-note"
          className="mt-wilms-2"
          rows={3}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Add context for the audit trail"
        />
      </div>
    </Modal>
  );
}
