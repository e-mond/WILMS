'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CurrencyAmount, KpiCard } from '@/components/data-display';
import { DetailSidebarCard, ExecutiveKpiGrid } from '@/components/layout/executive';
import { ExecutiveDetailLayout } from '@/components/layout/ExecutiveDetailLayout';
import { Alert } from '@/components/feedback/Alert';
import { EmptyState } from '@/components/feedback/EmptyState';
import { QueryErrorState } from '@/components/feedback/QueryErrorState';
import { InlinePanelSkeleton } from '@/components/feedback/PageSkeletons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { PERMISSION } from '@/constants/permissions';
import { Modal } from '@/components/ui/Modal';
import { PaymentEditSection } from '@/features/payment-collection/components/PaymentEditSection';
import { usePaymentEntryContext } from '@/features/payment-collection/hooks/usePaymentEntryContext';
import { useRecordPaymentOrQueue } from '@/features/payment-collection/hooks/useRecordPaymentOrQueue';
import { useSameDayPayment } from '@/features/payment-collection/hooks/useSameDayPayment';
import { invalidateAfterPayment } from '@/features/payment-collection/utils/invalidate-after-payment';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import {
  PAYMENT_DUPLICATE_MESSAGE,
  PAYMENT_ERROR_ALERT_TITLE,
} from '@/constants/payment-errors';
import { paymentService } from '@/services';
import { API_ERROR_CODE, ApiError } from '@/types/api';
import { captureGps, GpsCaptureError } from '@/utils/captureGps';
import { formatDisplayDate } from '@/utils/format-date';
import {
  notifyMutationError,
  notifyMutationSuccess,
} from '@/utils/mutation-feedback';

export interface PaymentEntryPanelProps {
  borrowerId: string;
}

type PendingAction =
  | { kind: 'pay'; weeksCount: number; label: string }
  | { kind: 'miss'; label: string };

export function PaymentEntryPanel({ borrowerId }: PaymentEntryPanelProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = usePaymentEntryContext(borrowerId);
  const { data: sameDayPayment } = useSameDayPayment(
    borrowerId,
    user?.id,
    data?.referenceDate,
  );
  const { isOffline } = useOfflineStatus();
  const recordPaymentMutation = useRecordPaymentOrQueue();
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [customWeeks, setCustomWeeks] = useState('1');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionErrorCode, setActionErrorCode] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'capturing' | 'captured' | 'denied'>('idle');

  const payableWeeks = useMemo(
    () => data?.payableWeeks ?? data?.obligationWeeks ?? [],
    [data?.payableWeeks, data?.obligationWeeks],
  );
  const maxWeeks = data?.maxPayableWeeks ?? payableWeeks.length;
  const weekly = data?.weeklyPaymentPesewas ?? 0;

  const selectedWeeks = useMemo(() => {
    if (!pendingAction || pendingAction.kind !== 'pay' || !data) {
      return [];
    }
    return payableWeeks.slice(0, pendingAction.weeksCount);
  }, [pendingAction, payableWeeks, data]);

  const selectedAmount = selectedWeeks.reduce((sum, week) => sum + week.amountPesewas, 0);
  const remainingAfter =
    data && pendingAction?.kind === 'pay'
      ? Math.max((data.outstandingPesewas ?? data.totalOutstandingObligationsPesewas) - selectedAmount, 0)
      : undefined;

  const markMissedMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !data) {
        throw new ApiError('Collector session is required.', API_ERROR_CODE.UNAUTHORIZED, 401);
      }
      return paymentService.markMissedPayment({
        borrowerId: data.borrowerId,
        paymentDate: data.referenceDate,
        collectorId: user.id,
        loanId: data.loanId || undefined,
      });
    },
    onSuccess: async () => {
      notifyMutationSuccess('Week marked missed', 'Borrower and collector notifications were queued.');
      await invalidateAfterPayment(queryClient, {
        borrowerId,
        loanId: data?.loanId ?? '',
      });
      setPendingAction(null);
      void refetch();
      router.push('/collector/dashboard');
    },
    onError: (err) => {
      notifyMutationError('Unable to mark missed', err, 'Please try again.');
      setActionError(err instanceof ApiError ? err.message : 'Unable to mark this week as missed.');
    },
  });

  const openPayConfirm = (weeksCount: number, label: string) => {
    setActionError(null);
    setActionErrorCode(null);
    setGpsStatus('idle');
    setPendingAction({ kind: 'pay', weeksCount, label });
  };

  const handleConfirm = async () => {
    if (!data || !pendingAction) {
      return;
    }

    setActionError(null);
    setActionErrorCode(null);
    setSuccessMessage(null);

    if (pendingAction.kind === 'miss') {
      if (isOffline) {
        setActionError('Mark missed requires a connection. Go online and try again.');
        return;
      }
      await markMissedMutation.mutateAsync();
      return;
    }

    if (!data.canAcceptPayment || pendingAction.weeksCount < 1) {
      return;
    }

    setGpsStatus('capturing');

    try {
      const gps = await captureGps();
      setGpsStatus('captured');
      const amountPesewas = weekly * pendingAction.weeksCount;

      const result = await recordPaymentMutation.mutateAsync({
        borrowerId: data.borrowerId,
        amountPesewas,
        paymentDate: data.referenceDate,
        gps,
        loanId: data.loanId,
        weeksCount: pendingAction.weeksCount,
        isOffline,
      });

      setPendingAction(null);

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

  const customWeeksNumber = Math.max(1, Math.min(maxWeeks || 1, Number.parseInt(customWeeks, 10) || 1));

  return (
    <div className="space-y-wilms-4">
      <ExecutiveKpiGrid>
        <KpiCard
          variant="executive"
          label="Weekly amount"
          value={<CurrencyAmount value={data.weeklyPaymentPesewas} />}
        />
        <KpiCard
          variant="executive"
          label="Total currently payable"
          value={
            <CurrencyAmount
              value={data.totalPayableAmountPesewas ?? data.totalOutstandingObligationsPesewas}
            />
          }
        />
        <KpiCard
          variant="executive"
          label="Payable weeks"
          value={`${maxWeeks} week(s)`}
        />
        <KpiCard
          variant="executive"
          label="Escalation"
          value={data.escalationLevel ?? 'NONE'}
        />
      </ExecutiveKpiGrid>

      <ExecutiveDetailLayout
        sidebar={
          <>
            <DetailSidebarCard title={data.borrowerName}>
              <dl className="space-y-wilms-3 text-small">
                <div>
                  <dt className="font-semibold text-text-muted">Group</dt>
                  <dd className="text-text-primary">{data.groupName ?? 'Unassigned'}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-text-muted">Loan</dt>
                  <dd className="text-text-primary">{data.loanDisplayId ?? data.loanId}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-text-muted">Payment day</dt>
                  <dd className="text-text-primary">{data.paymentDay}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-text-muted">Next due</dt>
                  <dd className="text-text-primary">
                    {data.nextDueDate ? formatDisplayDate(data.nextDueDate) : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-text-muted">Grace ends</dt>
                  <dd className="text-text-primary">
                    {data.gracePeriodEnd ? formatDisplayDate(data.gracePeriodEnd) : '—'}
                  </dd>
                </div>
              </dl>
            </DetailSidebarCard>
            <DetailSidebarCard title="Payment history">
              <dl className="space-y-wilms-3 text-small">
                <div>
                  <dt className="font-semibold text-text-muted">Last payment</dt>
                  <dd className="text-text-primary">
                    {data.lastPayment ? (
                      <>
                        <CurrencyAmount value={data.lastPayment.amountPesewas} /> on{' '}
                        {formatDisplayDate(data.lastPayment.paymentDate)}
                      </>
                    ) : (
                      'None recorded'
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-text-muted">Consecutive missed</dt>
                  <dd className="text-text-primary">{data.consecutiveMissedWeeks ?? 0}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-text-muted">Grace remaining</dt>
                  <dd className="text-text-primary">
                    {data.graceDays != null ? `${data.graceDays} day setting` : '—'}
                  </dd>
                </div>
              </dl>
            </DetailSidebarCard>
          </>
        }
      >
        <div className="space-y-wilms-4">
          {payableWeeks.length > 0 ? (
            <Alert title="Schedule-aware obligations" variant="info">
              <ul className="mt-wilms-2 list-disc space-y-1 pl-5 text-small">
                {payableWeeks.map((week) => (
                  <li key={week.weekNumber}>
                    Week {week.weekNumber} ({week.status}) due {formatDisplayDate(week.dueDate)} —{' '}
                    <CurrencyAmount value={week.amountPesewas} />
                  </li>
                ))}
              </ul>
            </Alert>
          ) : null}

          {data.blockReason ? (
            <Alert title="Payment not available" variant="warning">
              {data.blockReason}
            </Alert>
          ) : null}

          {isOffline ? (
            <Alert title="Offline mode" variant="warning">
              Payments can be queued offline. Mark missed requires a live connection.
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
                  : 'Action failed'
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
              <div className="space-y-wilms-3">
                <Button
                  type="button"
                  variant="primary"
                  className="w-full"
                  disabled={!data.canAcceptPayment || maxWeeks < 1}
                  onClick={() => openPayConfirm(1, 'Pay current week')}
                >
                  Pay current week (<CurrencyAmount value={weekly} />)
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  disabled={!data.canAcceptPayment || maxWeeks < 2}
                  onClick={() => openPayConfirm(2, 'Double payment')}
                >
                  Pay current + last week (Double) (
                  <CurrencyAmount value={weekly * 2} />)
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  disabled={!data.canAcceptPayment || maxWeeks < 1}
                  onClick={() => openPayConfirm(maxWeeks, 'Pay all payable weeks')}
                >
                  Pay all missed / payable weeks (
                  <CurrencyAmount
                    value={
                      data.totalPayableAmountPesewas ?? data.totalOutstandingObligationsPesewas
                    }
                  />
                  )
                </Button>
                <div className="flex flex-col gap-wilms-2 sm:flex-row sm:items-end">
                  <label className="block flex-1 space-y-wilms-1">
                    <span className="text-small font-semibold text-text-primary">
                      Custom weeks (1–{Math.max(maxWeeks, 1)})
                    </span>
                    <Input
                      type="number"
                      min={1}
                      max={Math.max(maxWeeks, 1)}
                      value={customWeeks}
                      onChange={(event) => setCustomWeeks(event.target.value)}
                    />
                  </label>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={!data.canAcceptPayment || maxWeeks < 1}
                    onClick={() =>
                      openPayConfirm(customWeeksNumber, `Pay ${customWeeksNumber} week(s)`)
                    }
                  >
                    Pay custom (
                    <CurrencyAmount value={weekly * customWeeksNumber} />)
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  disabled={isOffline || payableWeeks.length < 1}
                  onClick={() => {
                    setActionError(null);
                    setPendingAction({ kind: 'miss', label: 'Mark this week as missed' });
                  }}
                >
                  Mark this week as missed
                </Button>
              </div>
            </PermissionGate>
          )}
        </div>
      </ExecutiveDetailLayout>

      <Modal
        isOpen={pendingAction != null}
        title={pendingAction?.label ?? 'Confirm'}
        onClose={() => setPendingAction(null)}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              disabled={recordPaymentMutation.isPending || markMissedMutation.isPending}
              onClick={() => setPendingAction(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={
                recordPaymentMutation.isPending ||
                markMissedMutation.isPending ||
                gpsStatus === 'capturing'
              }
              onClick={() => void handleConfirm()}
            >
              {pendingAction?.kind === 'miss'
                ? markMissedMutation.isPending
                  ? 'Marking…'
                  : 'Confirm missed'
                : recordPaymentMutation.isPending || gpsStatus === 'capturing'
                  ? 'Capturing GPS...'
                  : isOffline
                    ? 'Save for sync'
                    : 'Confirm payment'}
            </Button>
          </>
        }
      >
        <div className="space-y-wilms-3 text-body text-text-muted">
          {pendingAction?.kind === 'miss' ? (
            <p>
              Mark the oldest unpaid week for <strong>{data.borrowerName}</strong> as missed. This
              updates the schedule, risk metrics, and notifications. It does not create a payment.
            </p>
          ) : (
            <>
              <p>
                Confirm collection of <CurrencyAmount value={selectedAmount} /> from{' '}
                <strong>{data.borrowerName}</strong>.
              </p>
              <ul className="list-disc space-y-1 pl-5 text-small">
                {selectedWeeks.map((week) => (
                  <li key={week.weekNumber}>
                    Week {week.weekNumber} · {formatDisplayDate(week.dueDate)} ·{' '}
                    <CurrencyAmount value={week.amountPesewas} />
                  </li>
                ))}
              </ul>
              {remainingAfter != null ? (
                <p>
                  Estimated remaining balance after allocation:{' '}
                  <CurrencyAmount value={remainingAfter} />
                </p>
              ) : null}
              <p>
                GPS coordinates will be captured automatically. Payment cannot be submitted if
                location access is denied.
              </p>
            </>
          )}
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
