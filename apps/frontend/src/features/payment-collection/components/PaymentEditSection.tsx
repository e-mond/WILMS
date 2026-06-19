'use client';

import { useState } from 'react';
import { CurrencyAmount } from '@/components/data-display';
import { Alert } from '@/components/feedback/Alert';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { PERMISSION } from '@/constants/permissions';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/forms';
import { Textarea } from '@/components/ui/Textarea';
import { createAdjustmentSchema } from '@/features/adjustments/adjustment.schema';
import { useCreateAdjustment } from '@/features/adjustments/hooks/useCreateAdjustment';
import { useEditPayment } from '@/features/payment-collection/hooks/useEditPayment';
import { useAuth } from '@/hooks/useAuth';
import { ADJUSTMENT_TYPE } from '@/types/adjustment';
import type { PaymentTransaction } from '@/types/payment';
import { ApiError } from '@/types/api';
import { captureGps, GpsCaptureError } from '@/utils/captureGps';
import { isPaymentEditable } from '@/utils/payment-same-day';
import { paymentEditSchema } from '@/utils/payment-edit.schema';
import { formatDisplayDate } from '@/utils/format-date';

export interface PaymentEditSectionProps {
  payment: PaymentTransaction;
  borrowerName: string;
  loanId: string;
  referenceDate: string;
}

export function PaymentEditSection({
  payment,
  borrowerName,
  loanId,
  referenceDate,
}: PaymentEditSectionProps) {
  const { user } = useAuth();
  const editPaymentMutation = useEditPayment(
    payment.id,
    payment.borrowerId,
    payment.collectorId,
    referenceDate,
  );
  const createAdjustmentMutation = useCreateAdjustment();
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentReasonError, setAdjustmentReasonError] = useState<string | null>(null);
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null);
  const [adjustmentSuccessMessage, setAdjustmentSuccessMessage] = useState<string | null>(null);

  const editable = isPaymentEditable(payment.paymentDate, payment.recordedAt, referenceDate);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user?.id) {
      return;
    }

    const parsed = paymentEditSchema.safeParse({ reason });

    if (!parsed.success) {
      setReasonError(parsed.error.issues[0]?.message ?? 'Invalid correction reason');
      return;
    }

    setReasonError(null);
    setActionError(null);
    setSuccessMessage(null);

    try {
      const gps = await captureGps();

      await editPaymentMutation.mutateAsync({
        collectorId: user.id,
        reason: parsed.data.reason,
        gps,
      });

      setSuccessMessage('Same-day correction saved. Supervisor has been notified.');
    } catch (error) {
      if (error instanceof GpsCaptureError) {
        setActionError(error.message);
        return;
      }

      setActionError(
        error instanceof ApiError ? error.message : 'Unable to save correction. Try again.',
      );
    }
  };

  const handleAdjustmentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user?.id) {
      return;
    }

    const parsed = createAdjustmentSchema.safeParse({ reason: adjustmentReason });

    if (!parsed.success) {
      setAdjustmentReasonError(parsed.error.issues[0]?.message ?? 'Invalid adjustment reason');
      return;
    }

    setAdjustmentReasonError(null);
    setAdjustmentError(null);
    setAdjustmentSuccessMessage(null);

    try {
      await createAdjustmentMutation.mutateAsync({
        type: ADJUSTMENT_TYPE.PAYMENT_CORRECTION,
        borrowerId: payment.borrowerId,
        borrowerName,
        loanId,
        amountPesewas: payment.amountPesewas,
        reason: `Payment ${payment.id} on ${payment.paymentDate}: ${parsed.data.reason}`,
      });

      setAdjustmentSuccessMessage(
        'Adjustment request submitted. A Super Admin must approve before the ledger changes.',
      );
      setAdjustmentReason('');
    } catch (error) {
      setAdjustmentError(
        error instanceof ApiError ? error.message : 'Unable to submit adjustment request. Try again.',
      );
    }
  };

  return (
    <section className="rounded-sm border border-border bg-card p-wilms-4">
      <h2 className="text-heading-3 font-semibold text-text-primary">Same-day correction</h2>
      <p className="mt-wilms-2 text-body text-text-muted">
        Payment of <CurrencyAmount value={payment.amountPesewas} /> for {borrowerName} was recorded
        on {formatDisplayDate(payment.paymentDate)}. Corrections are locked after the payment day
        ends.
      </p>

      {!editable ? (
        <div className="mt-wilms-4 space-y-wilms-4">
          <Alert title="Correction locked" variant="warning">
            This payment can no longer be edited because the payment day has ended. Request a Super
            Admin adjustment to correct it.
          </Alert>

          <form className="space-y-wilms-4" onSubmit={(event) => void handleAdjustmentSubmit(event)}>
            <FormField
              htmlFor="payment-adjustment-reason"
              label="Adjustment reason"
              error={adjustmentReasonError ?? undefined}
            >
              <Textarea
                id="payment-adjustment-reason"
                rows={3}
                placeholder="Explain what needs to be corrected and why Super Admin approval is required"
                value={adjustmentReason}
                onChange={(event) => setAdjustmentReason(event.target.value)}
              />
            </FormField>

            {adjustmentError ? (
              <Alert title="Adjustment request failed" variant="error">
                {adjustmentError}
              </Alert>
            ) : null}

            {adjustmentSuccessMessage ? (
              <Alert title="Adjustment requested" variant="success">
                {adjustmentSuccessMessage}
              </Alert>
            ) : null}

            <PermissionGate permission={PERMISSION.RECORD_COLLECTIONS}>
            <Button
              type="submit"
              variant="primary"
              disabled={createAdjustmentMutation.isPending}
              aria-label="Request Super Admin payment adjustment"
            >
              {createAdjustmentMutation.isPending
                ? 'Submitting adjustment request...'
                : 'Request Super Admin adjustment'}
            </Button>
            </PermissionGate>
          </form>
        </div>
      ) : (
        <form className="mt-wilms-4 space-y-wilms-4" onSubmit={(event) => void handleSubmit(event)}>
          <FormField htmlFor="payment-edit-reason" label="Correction reason" error={reasonError ?? undefined}>
            <Textarea
              id="payment-edit-reason"
              rows={3}
              placeholder="Explain what is being corrected and why"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </FormField>

          {actionError ? (
            <Alert title="Correction failed" variant="error">
              {actionError}
            </Alert>
          ) : null}

          {successMessage ? (
            <Alert title="Correction saved" variant="success">
              {successMessage}
            </Alert>
          ) : null}

          <PermissionGate permission={PERMISSION.RECORD_COLLECTIONS}>
          <Button
            type="submit"
            variant="secondary"
            disabled={editPaymentMutation.isPending}
            aria-label="Save same-day payment correction"
          >
            {editPaymentMutation.isPending ? 'Saving correction...' : 'Save same-day correction'}
          </Button>
          </PermissionGate>
        </form>
      )}
    </section>
  );
}
