'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/components/data-display';
import { InlinePanelSkeleton } from '@/components/feedback/PageSkeletons';
import { QueryErrorState } from '@/components/feedback/QueryErrorState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { borrowerUpdatesService } from '@/services/borrowerUpdatesService';
import {
  BORROWER_UPDATE_FIELD_LABELS,
  type BorrowerUpdateRequest,
} from '@/types/borrower-updates';
import { formatDisplayDate } from '@/utils/format-date';
import { useToast } from '@/hooks/useToast';

const reviewQueryKey = ['borrower-update-requests', 'pending'] as const;

export function PendingBorrowerUpdateQueue() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: reviewQueryKey,
    queryFn: () => borrowerUpdatesService.listRequests({ status: 'SUBMITTED' }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => borrowerUpdatesService.approve(id, notes[id]),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: reviewQueryKey });
      toast.success('Borrower update approved');
    },
    onError: (err: unknown) => {
      toast.error('Unable to approve', {
        message: err instanceof Error ? err.message : 'Try again shortly.',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => borrowerUpdatesService.reject(id, notes[id]),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: reviewQueryKey });
      toast.success('Borrower update rejected');
    },
    onError: (err: unknown) => {
      toast.error('Unable to reject', {
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
        error={error}
        onRetry={() => void refetch()}
        title="Unable to load pending borrower updates"
      />
    );
  }

  const rows = data?.requests ?? [];

  return (
    <DataTable<BorrowerUpdateRequest>
      caption="Pending borrower update requests"
      data={rows}
      emptyMessage="No pending borrower update requests."
      getRowId={(row) => row.id}
      columns={[
        {
          id: 'field',
          header: 'Field',
          cell: (row) => BORROWER_UPDATE_FIELD_LABELS[row.field],
        },
        {
          id: 'change',
          header: 'Change',
          cell: (row) => `${row.beforeValue || '—'} → ${row.afterValue}`,
        },
        {
          id: 'reason',
          header: 'Reason',
          cell: (row) => row.reason,
        },
        {
          id: 'submitted',
          header: 'Submitted',
          cell: (row) => formatDisplayDate(row.createdAt),
        },
        {
          id: 'review',
          header: 'Review',
          cell: (row) => (
            <div className="flex min-w-64 flex-col gap-wilms-2">
              <Input
                aria-label={`Review note for ${BORROWER_UPDATE_FIELD_LABELS[row.field]}`}
                value={notes[row.id] ?? ''}
                onChange={(event) =>
                  setNotes((current) => ({ ...current, [row.id]: event.target.value }))
                }
                placeholder="Review note"
              />
              <div className="flex gap-wilms-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => approveMutation.mutate(row.id)}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                >
                  Approve
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  onClick={() => rejectMutation.mutate(row.id)}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                >
                  Reject
                </Button>
              </div>
            </div>
          ),
        },
      ]}
    />
  );
}
