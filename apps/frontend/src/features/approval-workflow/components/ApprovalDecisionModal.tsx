'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { approvalReasonSchema } from '@/features/approval-workflow/approval.schema';
import type { ApprovalDecisionAction } from '@/types/approval';

const MODAL_COPY: Record<
  ApprovalDecisionAction,
  { title: string; description: string; confirmLabel: string; variant: 'primary' | 'danger' }
> = {
  approve: {
    title: 'Approve application',
    description: 'This borrower will be approved and notified by SMS and email.',
    confirmLabel: 'Approve',
    variant: 'primary',
  },
  reject: {
    title: 'Reject application',
    description: 'Provide a reason. The borrower will be notified by SMS.',
    confirmLabel: 'Reject',
    variant: 'danger',
  },
  blacklist: {
    title: 'Blacklist borrower',
    description:
      'Provide a reason. The borrower will be permanently barred from future registration.',
    confirmLabel: 'Blacklist',
    variant: 'danger',
  },
};

export interface ApprovalDecisionModalProps {
  action: ApprovalDecisionAction | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<void>;
}

export function ApprovalDecisionModal({
  action,
  isSubmitting,
  onClose,
  onConfirm,
}: ApprovalDecisionModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!action) {
    return null;
  }

  const copy = MODAL_COPY[action];
  const requiresReason = action !== 'approve';

  const handleConfirm = async () => {
    setError(null);

    if (requiresReason) {
      const parsed = approvalReasonSchema.safeParse({ reason });
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
            aria-label={`Confirm ${copy.confirmLabel.toLowerCase()}`}
            onClick={() => void handleConfirm()}
          >
            {isSubmitting ? 'Saving...' : copy.confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-body text-text-muted">{copy.description}</p>
      {requiresReason ? (
        <div className="mt-wilms-4">
          <label htmlFor="approval-reason" className="text-small font-semibold text-text-primary">
            Reason
          </label>
          <Textarea
            id="approval-reason"
            className="mt-wilms-2"
            hasError={Boolean(error)}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Enter the decision reason"
          />
          {error ? <p className="mt-wilms-2 text-small text-danger">{error}</p> : null}
        </div>
      ) : null}
    </Modal>
  );
}
