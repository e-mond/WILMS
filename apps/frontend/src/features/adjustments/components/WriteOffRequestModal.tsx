'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { ADJUSTMENT_TYPE } from '@/types/adjustment';
import { useCreateAdjustment } from '@/features/adjustments/hooks/useCreateAdjustment';
import { createAdjustmentSchema } from '@/features/adjustments/adjustment.schema';

export interface WriteOffRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WriteOffRequestModal({ isOpen, onClose }: WriteOffRequestModalProps) {
  const createAdjustment = useCreateAdjustment();
  const [loanId, setLoanId] = useState('');
  const [borrowerId, setBorrowerId] = useState('');
  const [amountGhs, setAmountGhs] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setLoanId('');
    setBorrowerId('');
    setAmountGhs('');
    setReason('');
    setError(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit() {
    setError(null);

    const amountValue = Number(amountGhs);
    if (!loanId.trim() || !borrowerId.trim()) {
      setError('Loan ID and borrower ID are required.');
      return;
    }
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setError('Enter a valid write-off amount in GHS.');
      return;
    }

    const parsed = createAdjustmentSchema.safeParse({ reason });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'A reason is required.');
      return;
    }

    const amountPesewas = Math.round(amountValue * 100);

    try {
      await createAdjustment.mutateAsync({
        type: ADJUSTMENT_TYPE.WRITE_OFF,
        loanId: loanId.trim(),
        borrowerId: borrowerId.trim(),
        borrowerName: borrowerId.trim(),
        amountPesewas,
        reason: parsed.data.reason,
      });
      handleClose();
    } catch {
      // useCreateAdjustment already toasts errors
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Request write-off"
      footer={
        <>
          <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={createAdjustment.isPending}
            onClick={() => void handleSubmit()}
          >
            {createAdjustment.isPending ? 'Submitting…' : 'Submit write-off'}
          </Button>
        </>
      }
    >
      <p className="text-body text-text-muted">
        Submit a write-off for Super Admin approval. Approved write-offs also blacklist the borrower.
      </p>
      <div className="mt-wilms-3 space-y-wilms-3">
        <Input
          aria-label="Loan ID"
          placeholder="Loan ID"
          value={loanId}
          onChange={(event) => setLoanId(event.target.value)}
        />
        <Input
          aria-label="Borrower ID"
          placeholder="Borrower ID"
          value={borrowerId}
          onChange={(event) => setBorrowerId(event.target.value)}
        />
        <Input
          aria-label="Amount in GHS"
          placeholder="Amount (GHS)"
          inputMode="decimal"
          value={amountGhs}
          onChange={(event) => setAmountGhs(event.target.value)}
        />
        <Textarea
          aria-label="Write-off reason"
          placeholder="Reason for write-off..."
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
        {error ? (
          <p className="text-small text-danger" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
