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
import { useAuth } from '@/hooks/useAuth';
import { ADJUSTMENT_TYPE } from '@/types/adjustment';
import type { PaymentTransaction } from '@/types/payment';
import { ApiError } from '@/types/api';
import { formatDisplayDate } from '@/utils/format-date';

export interface PaymentEditSectionProps {
  payment: PaymentTransaction;
  borrowerName: string;
  loanId: string;
  referenceDate: string;
}

/**
 * Posted collections are immutable. Corrections require Super Admin reversal
 * (or an adjustment request) — never a silent PATCH that leaves books unchanged.
 */
export function PaymentEditSection({
  payment,
  borrowerName,
  loanId,
}: PaymentEditSectionProps) {
  const { user } = useAuth();
  const createAdjustmentMutation = useCreateAdjustment();
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentReasonError, setAdjustmentReasonError] = useState<string | null>(null);
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null);
  const [adjustmentSuccessMessage, setAdjustmentSuccessMessage] = useState<string | null>(null);

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
      <h2 className="text-heading-3 font-semibold text-text-primary">Payment corrections</h2>
      <p className="mt-wilms-2 text-body text-text-muted">
        Payment of <CurrencyAmount value={payment.amountPesewas} /> for {borrowerName} was recorded
        on {formatDisplayDate(payment.paymentDate)}. Posted collections cannot be edited in place.
      </p>

      <div className="mt-wilms-4 space-y-wilms-4">
        <Alert title="Immutable ledger" variant="warning">
          To correct a posted payment, a Super Admin must reverse it and record a new collection.
          Same-day silent edits are disabled so books cannot diverge from the ledger.
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
    </section>
  );
}
