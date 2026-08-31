'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/components/data-display';
import { QueryErrorState } from '@/components/feedback/QueryErrorState';
import { InlinePanelSkeleton } from '@/components/feedback/PageSkeletons';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { Button } from '@/components/ui/Button';
import { PERMISSION } from '@/constants/permissions';
import { loanService } from '@/services';
import type { LoanScheduleChangeRecord } from '@/types/enterprise';
import { formatDisplayDate } from '@/utils/format-date';
import { resolveLoanDisplayId } from '@/utils/entity-display-id';
import { useToast } from '@/hooks/useToast';

const pendingScheduleChangesQueryKey = ['loan-schedule-changes', 'pending'] as const;

export function PendingScheduleChangeQueue() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const {
    data: changes,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: pendingScheduleChangesQueryKey,
    queryFn: () => loanService.listPendingScheduleChanges(),
  });

  const { data: loans } = useQuery({
    queryKey: ['loans', 'ops-reassignment', 'portfolio'],
    queryFn: () => loanService.listPortfolioEntries(),
  });

  const loanById = useMemo(
    () => new Map((loans ?? []).map((loan) => [loan.id, loan])),
    [loans],
  );

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: pendingScheduleChangesQueryKey }),
      queryClient.invalidateQueries({ queryKey: ['loans'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['reports'] }),
    ]);
  };

  const reviewMutation = useMutation({
    mutationFn: (changeId: string) => loanService.reviewScheduleChange(changeId, notes[changeId]),
    onSuccess: async () => {
      await invalidate();
      toast.success('Schedule change reviewed');
    },
    onError: (err: unknown) => {
      toast.error('Unable to review schedule change', {
        message: err instanceof Error ? err.message : 'Try again shortly.',
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (changeId: string) => loanService.approveScheduleChange(changeId, notes[changeId]),
    onSuccess: async (result) => {
      await invalidate();
      toast.success('Schedule change approved', {
        message:
          result.nextDueDate != null
            ? `${result.recalculatedWeeks ?? 0} future weeks updated. Next due date: ${formatDisplayDate(result.nextDueDate)}.`
            : 'Future pending weeks were recalculated.',
      });
    },
    onError: (err: unknown) => {
      toast.error('Unable to approve schedule change', {
        message: err instanceof Error ? err.message : 'Try again shortly.',
      });
    },
  });

  if (isLoading) {
    return <InlinePanelSkeleton />;
  }

  if (isError) {
    return (
      <QueryErrorState
        title="Unable to load payment day requests"
        description={error instanceof Error ? error.message : 'Try again shortly.'}
        onRetry={() => void refetch()}
      />
    );
  }

  const rows = changes ?? [];

  return (
    <div className="space-y-wilms-3">
      <div>
        <h3 className="text-heading-3 font-semibold text-text-primary">Pending payment day changes</h3>
        <p className="text-small text-text-muted">
          Schedule changes stay pending until a different authorised reviewer clears them.
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="text-small text-text-muted">No pending payment day changes awaiting action.</p>
      ) : (
        <DataTable<LoanScheduleChangeRecord>
          variant="executive"
          layout="auto"
          caption="Pending payment day changes"
          data={rows}
          getRowId={(row) => row.id}
          columns={[
            {
              id: 'loan',
              header: 'Loan',
              cell: (row) => {
                const loan = loanById.get(row.loanId);
                return (
                  <div className="text-left">
                    <p className="font-semibold text-text-primary">
                      {loan ? resolveLoanDisplayId(loan) : row.loanId}
                    </p>
                    <p className="text-small text-text-muted">{loan?.borrowerName ?? row.borrowerId}</p>
                  </div>
                );
              },
            },
            {
              id: 'change',
              header: 'Change',
              cell: (row) => `${row.fromPaymentDay} -> ${row.toPaymentDay}`,
            },
            {
              id: 'effectiveFrom',
              header: 'Effective',
              cell: (row) => formatDisplayDate(row.effectiveFrom),
            },
            {
              id: 'status',
              header: 'Status',
              cell: (row) => row.status,
            },
            {
              id: 'reason',
              header: 'Reason',
              cell: (row) => row.reason,
            },
            {
              id: 'actions',
              header: 'Actions',
              className: 'min-w-[18rem]',
              cell: (row) => (
                <div className="flex flex-col gap-wilms-2">
                  <input
                    aria-label={`Decision note for ${row.id}`}
                    className="min-w-0 rounded-sm border border-border bg-surface px-2 py-1 text-small"
                    placeholder="Note (optional)"
                    value={notes[row.id] ?? ''}
                    onChange={(event) =>
                      setNotes((current) => ({ ...current, [row.id]: event.target.value }))
                    }
                  />
                  <div className="flex flex-wrap gap-wilms-2">
                    <PermissionGate permission={PERMISSION.APPROVE_BORROWERS}>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={reviewMutation.isPending || approveMutation.isPending || row.status !== 'PENDING'}
                        onClick={() => void reviewMutation.mutateAsync(row.id)}
                      >
                        Review
                      </Button>
                    </PermissionGate>
                    <PermissionGate permission={PERMISSION.MANAGE_SYSTEM_SETTINGS}>
                      <Button
                        size="sm"
                        disabled={reviewMutation.isPending || approveMutation.isPending}
                        onClick={() => void approveMutation.mutateAsync(row.id)}
                      >
                        Approve
                      </Button>
                    </PermissionGate>
                  </div>
                </div>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
