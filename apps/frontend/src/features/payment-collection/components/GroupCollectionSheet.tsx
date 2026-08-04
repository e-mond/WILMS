'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar, CurrencyAmount, DataTable } from '@/components/data-display';
import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/Button';
import { useCollectorDashboard } from '@/features/payment-collection/hooks/useCollectorDashboard';
import {
  applySelectAllChoice,
  buildInitialSheetMembers,
  isSheetRowLocked,
  setMemberChoice,
  submitGroupCollectionBatch,
  type SheetMember,
  type SheetPaymentMode,
} from '@/features/payment-collection/group-collection-sheet.utils';
import { invalidateAfterPayment } from '@/features/payment-collection/utils/invalidate-after-payment';
import { useAuth } from '@/hooks/useAuth';
import { paymentService } from '@/services';
import { captureGps, GpsCaptureError } from '@/utils/captureGps';
import { resolvePersonPhotoUrl } from '@/utils/person-photo';
import { resolveGroupDisplayId } from '@/utils/entity-display-id';
import { cn } from '@/utils/cn';

export interface GroupCollectionSheetProps {
  groupId: string;
}

export function GroupCollectionSheet({ groupId }: GroupCollectionSheetProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useCollectorDashboard(user?.id);
  const [members, setMembers] = useState<SheetMember[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [paymentType, setPaymentType] = useState<SheetPaymentMode>('NORMAL');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const group = data?.todayGroups.find((entry) => entry.groupId === groupId);
  const paymentDate = data?.summary.date ?? new Date().toISOString().slice(0, 10);

  useEffect(() => {
    setInitialized(false);
    setMembers([]);
    setActionError(null);
    setSuccessMessage(null);
  }, [groupId]);

  useEffect(() => {
    if (!data || initialized) {
      return;
    }
    setMembers(buildInitialSheetMembers(data.borrowers, groupId));
    setInitialized(true);
  }, [data, groupId, initialized]);

  const sheetMembers = useMemo(() => members, [members]);
  const selectableCount = sheetMembers.filter(
    (member) => !isSheetRowLocked(member) && member.choice === 'UNSET',
  ).length;
  const selectedCount = sheetMembers.filter(
    (member) => !isSheetRowLocked(member) && member.choice !== 'UNSET',
  ).length;

  const handleSubmitSelected = async () => {
    if (!user?.id) {
      setActionError('Collector session is required.');
      return;
    }

    if (selectedCount === 0) {
      setActionError('Mark at least one member as Paid or Missed before recording.');
      return;
    }

    setSubmitting(true);
    setActionError(null);
    setSuccessMessage(null);

    try {
      const gps = await captureGps();
      const result = await submitGroupCollectionBatch(sheetMembers, {
        collectorId: user.id,
        paymentDate,
        paymentMode: paymentType,
        gps,
        recordPayment: (input) => paymentService.recordPayment(input),
        markMissedPayment: (input) => paymentService.markMissedPayment(input),
      });

      setMembers(result.members);

      if (result.paidCount > 0 || result.missedCount > 0) {
        await invalidateAfterPayment(queryClient, {
          borrowerId: result.members[0]?.borrowerId ?? '',
          loanId: result.members[0]?.loanId ?? '',
        });
        await refetch();
      }

      if (result.errorCount > 0) {
        setActionError(
          `Recorded ${result.paidCount} paid and ${result.missedCount} missed. ${result.errorCount} row(s) failed — see errors below.`,
        );
      } else {
        setSuccessMessage(
          `Recorded ${result.paidCount} paid and ${result.missedCount} missed (${paymentType.toLowerCase()} mode).`,
        );
      }
    } catch (error) {
      if (error instanceof GpsCaptureError) {
        setActionError(error.message);
      } else {
        setActionError(error instanceof Error ? error.message : 'Unable to submit collection sheet.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !data) {
    return <p className="text-body text-text-muted">Loading group collection sheet...</p>;
  }

  return (
    <div className="space-y-wilms-4">
      <div className="flex flex-wrap items-center justify-between gap-wilms-3">
        <div>
          <Link
            href="/collector/dashboard"
            className="text-small font-semibold text-brand-primary hover:underline"
          >
            Back to dashboard
          </Link>
          <h1 className="mt-wilms-2 text-heading-2 font-semibold text-text-primary">
            {group?.groupName ?? 'Group Collection Sheet'}
          </h1>
          <p className="text-small text-text-muted">
            {group?.community ?? 'Assigned group'} · {resolveGroupDisplayId({ id: groupId })}
          </p>
        </div>
        <div className="flex flex-wrap gap-wilms-2">
          {(['NORMAL', 'DOUBLE', 'PARTIAL', 'ADVANCE'] as const).map((type) => (
            <Button
              key={type}
              type="button"
              size="sm"
              variant={paymentType === type ? 'primary' : 'secondary'}
              onClick={() => setPaymentType(type)}
              disabled={submitting}
            >
              {type}
            </Button>
          ))}
        </div>
      </div>

      {actionError ? (
        <Alert title="Collection sheet" variant="warning">
          {actionError}
        </Alert>
      ) : null}
      {successMessage ? (
        <Alert title="Recorded" variant="success">
          {successMessage}
        </Alert>
      ) : null}

      <div className="flex flex-wrap gap-wilms-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={submitting || selectableCount === 0}
          onClick={() => setMembers((current) => applySelectAllChoice(current, 'PAID'))}
        >
          Select all Paid
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={submitting || selectableCount === 0}
          onClick={() => setMembers((current) => applySelectAllChoice(current, 'MISSED'))}
        >
          Select all Missed
        </Button>
      </div>

      {sheetMembers.length === 0 ? (
        <p className="text-body text-text-muted">
          No members are due for collection in this group today.
        </p>
      ) : (
        <DataTable
          data={sheetMembers}
          getRowId={(row) => row.borrowerId}
          columns={[
            {
              id: 'member',
              header: 'Member',
              cell: (row) => (
                <div
                  className={cn(
                    'flex items-center gap-wilms-3',
                    isSheetRowLocked(row) && 'opacity-50',
                  )}
                >
                  <Avatar
                    label={row.borrowerName}
                    photoUrl={resolvePersonPhotoUrl({
                      name: row.borrowerName,
                      id: row.borrowerId,
                    })}
                    size="sm"
                  />
                  <div>
                    <span className="font-semibold">{row.borrowerName}</span>
                    {row.rowError ? (
                      <p className="text-small text-danger">{row.rowError}</p>
                    ) : null}
                    {row.recorded === 'COLLECTED' ? (
                      <p className="text-small text-status-active">Collected</p>
                    ) : null}
                    {row.recorded === 'MISSED' ? (
                      <p className="text-small text-danger">Missed</p>
                    ) : null}
                  </div>
                </div>
              ),
            },
            {
              id: 'expected',
              header: 'Expected',
              cell: (row) => (
                <span className={cn(isSheetRowLocked(row) && 'opacity-50')}>
                  <CurrencyAmount value={row.expectedPesewas} />
                </span>
              ),
            },
            {
              id: 'choice',
              header: 'Mark payment',
              cell: (row) => {
                const locked = isSheetRowLocked(row);
                return (
                  <div className={cn('flex gap-wilms-2', locked && 'opacity-40')}>
                    <Button
                      type="button"
                      size="sm"
                      variant={row.choice === 'PAID' ? 'primary' : 'secondary'}
                      disabled={locked || submitting}
                      onClick={() =>
                        setMembers((current) => setMemberChoice(current, row.borrowerId, 'PAID'))
                      }
                    >
                      Paid
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={row.choice === 'MISSED' ? 'danger' : 'secondary'}
                      disabled={locked || submitting}
                      onClick={() =>
                        setMembers((current) => setMemberChoice(current, row.borrowerId, 'MISSED'))
                      }
                    >
                      Missed
                    </Button>
                  </div>
                );
              },
            },
          ]}
        />
      )}

      <div className="flex flex-wrap items-center gap-wilms-3">
        <Button
          type="button"
          variant="primary"
          onClick={() => void handleSubmitSelected()}
          disabled={submitting || selectedCount === 0}
        >
          {submitting ? 'Recording…' : 'Record selected'}
        </Button>
        <p className="text-small text-text-muted">
          {selectedCount} selected · GPS captured once per batch
        </p>
      </div>
    </div>
  );
}
