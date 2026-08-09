'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/components/data-display';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { InlinePanelSkeleton } from '@/components/feedback/PageSkeletons';
import { QueryErrorState } from '@/components/feedback/QueryErrorState';
import { Button } from '@/components/ui/Button';
import { PERMISSION } from '@/constants/permissions';
import { holidayRequestsService } from '@/services/holidayRequestsService';
import type { HolidayRequest } from '@/types/holiday-requests';
import { formatDisplayDate } from '@/utils/format-date';
import { useToast } from '@/hooks/useToast';

const reviewQueryKey = ['holiday-requests', 'review'] as const;

export function HolidayRequestReviewQueue() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: reviewQueryKey,
    queryFn: () => holidayRequestsService.listRequests({ status: 'SUBMITTED' }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => holidayRequestsService.approve(id, notes[id]),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: reviewQueryKey });
      await queryClient.invalidateQueries({ queryKey: ['organization-holidays'] });
      toast.success('Holiday request approved and applied');
    },
    onError: (err: unknown) => {
      toast.error('Unable to approve', {
        message: err instanceof Error ? err.message : 'Try again shortly.',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => holidayRequestsService.reject(id, notes[id]),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: reviewQueryKey });
      toast.success('Holiday request rejected');
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
        title="Unable to load holiday requests"
        description={error instanceof Error ? error.message : 'Try again shortly.'}
        onRetry={() => void refetch()}
      />
    );
  }

  const requests = data?.requests ?? [];

  return (
    <PermissionGate
      permissions={[PERMISSION.MANAGE_SYSTEM_SETTINGS, PERMISSION.ACCESS_APPROVER_PORTAL]}
    >
      <div className="space-y-wilms-3">
        <div>
          <h3 className="text-heading-3 font-semibold text-text-primary">Pending holiday requests</h3>
          <p className="text-small text-text-muted">
            Maker-checker applies: you cannot approve a request you submitted.
          </p>
        </div>
        {requests.length === 0 ? (
          <p className="text-small text-text-muted">No submitted holiday requests awaiting review.</p>
        ) : (
          <DataTable<HolidayRequest>
            variant="executive"
            layout="auto"
            caption="Holiday requests awaiting review"
            data={requests}
            getRowId={(row) => row.id}
            columns={[
              { id: 'name', header: 'Name', cell: (row) => row.name },
              {
                id: 'date',
                header: 'Date',
                cell: (row) =>
                  `${formatDisplayDate(row.holidayDate)}${
                    row.endDate ? ` – ${formatDisplayDate(row.endDate)}` : ''
                  }`,
              },
              {
                id: 'reason',
                header: 'Reason',
                cell: (row) => row.reason ?? '—',
              },
              {
                id: 'actions',
                header: 'Actions',
                cell: (row) => (
                  <div className="flex flex-col gap-wilms-2 sm:flex-row sm:items-center">
                    <input
                      aria-label={`Review note for ${row.name}`}
                      className="min-w-0 flex-1 rounded-sm border border-border bg-surface px-2 py-1 text-small"
                      placeholder="Note (optional)"
                      value={notes[row.id] ?? ''}
                      onChange={(event) =>
                        setNotes((prev) => ({ ...prev, [row.id]: event.target.value }))
                      }
                    />
                    <Button
                      size="sm"
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      onClick={() => void approveMutation.mutateAsync(row.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      onClick={() => void rejectMutation.mutateAsync(row.id)}
                    >
                      Reject
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </div>
    </PermissionGate>
  );
}
