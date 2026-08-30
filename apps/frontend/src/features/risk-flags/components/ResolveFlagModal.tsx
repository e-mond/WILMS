'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { resolveRiskFlagDisplayId } from '@/utils/entity-display-id';
import type { RiskFlagSummary } from '@/types/risk-flag';

export interface ResolveFlagModalProps {
  flag: RiskFlagSummary | null;
  isOpen: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

export function ResolveFlagModal({
  flag,
  isOpen,
  isSubmitting = false,
  onClose,
  onSubmit,
}: ResolveFlagModalProps) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setReason('');
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mark Resolved"
      footer={
        <>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={isSubmitting || !reason.trim()}
            onClick={() => onSubmit(reason.trim())}
          >
            Resolve Flag
          </Button>
        </>
      }
    >
      <div className="space-y-wilms-4">
        {flag ? (
          <p className="text-small text-text-muted">
            Resolve{' '}
            <span className="font-semibold text-text-primary">{resolveRiskFlagDisplayId(flag)}</span>
            {' for '}
            <span className="font-semibold text-text-primary">{flag.entityName}</span>.
            The assigned officer will be notified when different from you.
          </p>
        ) : null}

        <div>
          <label htmlFor="resolve-flag-reason" className="text-small font-semibold text-text-primary">
            Resolution note
          </label>
          <Textarea
            id="resolve-flag-reason"
            className="mt-wilms-2"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Describe how the risk was cleared"
            rows={4}
          />
        </div>
      </div>
    </Modal>
  );
}
