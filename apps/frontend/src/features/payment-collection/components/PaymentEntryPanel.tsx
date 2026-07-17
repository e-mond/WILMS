'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CurrencyAmount, KpiCard } from '@/components/data-display';
import { DetailSidebarCard, ExecutiveKpiGrid } from '@/components/layout/executive';
import { ExecutiveDetailLayout } from '@/components/layout/ExecutiveDetailLayout';
import { Alert } from '@/components/feedback/Alert';
import { EmptyState } from '@/components/feedback/EmptyState';
import { QueryErrorState } from '@/components/feedback/QueryErrorState';
import { InlinePanelSkeleton } from '@/components/feedback/PageSkeletons';
import { Button } from '@/components/ui/Button';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { PERMISSION } from '@/constants/permissions';
import { Modal } from '@/components/ui/Modal';
import { PaymentEditSection } from '@/features/payment-collection/components/PaymentEditSection';
import { usePaymentEntryContext } from '@/features/payment-collection/hooks/usePaymentEntryContext';
import { useRecordPaymentOrQueue } from '@/features/payment-collection/hooks/useRecordPaymentOrQueue';
import { useSameDayPayment } from '@/features/payment-collection/hooks/useSameDayPayment';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import {
  PAYMENT_DUPLICATE_MESSAGE,
  PAYMENT_ERROR_ALERT_TITLE,
} from '@/constants/payment-errors';
import { API_ERROR_CODE, ApiError } from '@/types/api';
import { captureGps, GpsCaptureError } from '@/utils/captureGps';
import { formatDisplayDate } from '@/utils/format-date';

export interface PaymentEntryPanelProps {
  borrowerId: string;
}

export function PaymentEntryPanel({ borrowerId }: PaymentEntryPanelProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = usePaymentEntryContext(borrowerId);
  const { data: sameDayPayment } = useSameDayPayment(
    borrowerId,
    user?.id,
    data?.referenceDate,
  );
  const { isOffline } = useOfflineStatus();
  const recordPaymentMutation = useRecordPaymentOrQueue();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionErrorCode, setActionErrorCode] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'capturing' | 'captured' | 'denied'>('idle');

  const handleOpenConfirm = () => {
    setActionError(null);
    setActionErrorCode(null);
    setGpsStatus('idle');
    setIsConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!data?.canAcceptPayment) {
      return;
    }

    setActionError(null);
    setActionErrorCode(null);
    setSuccessMessage(null);
    setGpsStatus('capturing');

    try {
      const gps = await captureGps();
      setGpsStatus('captured');

      const result = await recordPaymentMutation.mutateAsync({
        borrowerId: data.borrowerId,
        amountPesewas: data.requiredAmountPesewas,
        paymentDate: data.referenceDate,
        gps,
        loanId: data.loanId,
        isOffline,
      });

      setIsConfirmOpen(false);

      if (result.mode === 'offline') {
        setSuccessMessage('Payment saved for sync. It will upload when connection returns.');
        router.push('/collector/dashboard');
        return;
      }

      router.push('/collector/dashboard');
    } catch (error) {
      if (error instanceof GpsCaptureError) {
        setGpsStatus('denied');
        setActionError(error.message);
        return;
      }

      if (error instanceof ApiError) {
        setActionErrorCode(error.code);
        setActionError(
          error.code === API_ERROR_CODE.DUPLICATE_TRANSACTION
            ? PAYMENT_DUPLICATE_MESSAGE
            : error.message,
        );
        return;
      }

      setActionErrorCode(null);
      setActionError('Unable to record payment. Please try again.');
    }
  };

  if (isLoading) {
    return <InlinePanelSkeleton />;
  }

  if (isError) {
    return (
      <QueryErrorState
        error={error}
        onRetry={() => void refetch()}
        title="Unable to load payment entry"
        description="This borrower may not have an active loan or could not be found."
      />
    );
  }

  if (!data) {
    return (
      <EmptyState
        title="Unable to load payment entry"
        description="This borrower may not have an active loan or could not be found."
        action={
          <Link
            href="/collector/dashboard"
            className="text-small font-semibold text-brand-primary hover:underline"
          >
            Back to dashboard
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-wilms-4">
      <ExecutiveKpiGrid>
        <KpiCard
          variant="executive"
          label="Required today"
          value={<CurrencyAmount value={data.requiredAmountPesewas} />}
        />
        <KpiCard
          variant="executive"
          label="Weekly amount"
          value={<CurrencyAmount value={data.weeklyPaymentPesewas} />}
        />
        <KpiCard
          variant="executive"
          label="Outstanding"
          value={<CurrencyAmount value={data.totalOutstandingObligationsPesewas} />}
        />
        <KpiCard
          variant="executive"
          label="Obligations due"
          value={`${data.obligationWeeks.length} week(s)`}
        />
      </ExecutiveKpiGrid>

      <ExecutiveDetailLayout
        sidebar={
          <>
            <DetailSidebarCard title={data.borrowerName}>
              <dl className="space-y-wilms-3 text-small">
                <div>
                  <dt className="font-semibold text-text-muted">Community</dt>
                  <dd className="text-text-primary">{data.community}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-text-muted">Phone</dt>
                  <dd className="text-text-primary">{data.phone}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-text-muted">Payment day</dt>
                  <dd className="text-text-primary">{data.paymentDay}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-text-muted">Today</dt>
                  <dd className="text-text-primary">{formatDisplayDate(data.referenceDate)}</dd>
                </div>
              </dl>
            </DetailSidebarCard>
            {data.oldestObligation ? (
              <DetailSidebarCard title="Oldest obligation">
                <p className="text-small text-text-muted">
                  Week {data.oldestObligation.weekNumber} due{' '}
                  {formatDisplayDate(data.oldestObligation.dueDate)} clears first on confirmation.
                </p>
              </DetailSidebarCard>
            ) : null}
          </>
        }
      >
        <div className="space-y-wilms-4">
          {data.oldestObligation ? (
            <Alert title="Oldest obligation clears first" variant="info">
              Pay exactly <CurrencyAmount value={data.requiredAmountPesewas} /> — partial and advance
              payments are not allowed.
            </Alert>
          ) : null}

          {data.blockReason ? (
            <Alert title="Payment not available" variant="warning">
              {data.blockReason}
            </Alert>
          ) : null}

          {isOffline ? (
            <Alert title="Offline mode" variant="warning">
              You are offline. Payments will be saved locally and synced when connection returns.
            </Alert>
          ) : null}

          {successMessage ? (
            <Alert title="Saved for sync" variant="success">
              {successMessage}
            </Alert>
          ) : null}

          {actionError ? (
            <Alert
              title={
                actionErrorCode
                  ? (PAYMENT_ERROR_ALERT_TITLE[actionErrorCode] ?? 'Payment failed')
                  : 'Payment failed'
              }
              variant="error"
            >
              {actionError}
            </Alert>
          ) : null}

          {sameDayPayment ? (
            <PaymentEditSection
              payment={sameDayPayment}
              borrowerName={data.borrowerName}
              loanId={data.loanId}
              referenceDate={data.referenceDate}
            />
          ) : (
            <PermissionGate permission={PERMISSION.RECORD_COLLECTIONS}>
              <Button
                type="button"
                variant="primary"
                className="w-full"
                disabled={!data.canAcceptPayment}
                aria-label={
                  isOffline ? 'Save weekly payment for sync' : 'Record weekly payment'
                }
                onClick={handleOpenConfirm}
              >
                {isOffline ? 'Save for sync' : 'Record payment'} of{' '}
                <CurrencyAmount value={data.requiredAmountPesewas} />
              </Button>
            </PermissionGate>
          )}
        </div>
      </ExecutiveDetailLayout>

      <Modal
        isOpen={isConfirmOpen}
        title="Confirm payment"
        onClose={() => setIsConfirmOpen(false)}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              disabled={recordPaymentMutation.isPending}
              onClick={() => setIsConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={recordPaymentMutation.isPending || gpsStatus === 'capturing'}
              aria-label={
                isOffline ? 'Save payment for sync' : 'Confirm payment recording'
              }
              onClick={() => void handleConfirm()}
            >
              {recordPaymentMutation.isPending || gpsStatus === 'capturing'
                ? 'Capturing GPS...'
                : isOffline
                  ? 'Save for sync'
                  : 'Confirm payment'}
            </Button>
          </>
        }
      >
        <div className="space-y-wilms-3 text-body text-text-muted">
          <p>
            Confirm collection of{' '}
            <CurrencyAmount value={data.requiredAmountPesewas} /> from{' '}
            <strong>{data.borrowerName}</strong> for Week{' '}
            {data.oldestObligation?.weekNumber}.
          </p>
          <p>
            GPS coordinates will be captured automatically. Payment cannot be submitted if location
            access is denied.
          </p>
          {gpsStatus === 'denied' ? (
            <p className="font-semibold text-danger">
              GPS access denied. Enable location and try again.
            </p>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
