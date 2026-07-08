'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/components/data-display';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { Button } from '@/components/ui/Button';
import { offlineSyncService } from '@/services';
import type { SyncConflict } from '@/types/sync-conflict';
import { useToast } from '@/hooks/useToast';
import { formatDisplayDate } from '@/utils/format-date';

export function SyncConflictPanel() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const conflictsQuery = useQuery({
    queryKey: ['sync', 'conflicts'],
    queryFn: () => offlineSyncService.listSyncConflicts(),
    refetchInterval: 30_000,
  });

  const approveMutation = useMutation({
    mutationFn: (conflictId: string) => offlineSyncService.approveSyncConflict(conflictId),
    onSuccess: () => {
      toast.success('Offline operation approved');
      void queryClient.invalidateQueries({ queryKey: ['sync', 'conflicts'] });
    },
    onError: (error: Error) => {
      toast.error('Unable to approve operation', { message: error.message });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (conflictId: string) => offlineSyncService.rejectSyncConflict(conflictId),
    onSuccess: () => {
      toast.success('Offline operation rejected');
      void queryClient.invalidateQueries({ queryKey: ['sync', 'conflicts'] });
    },
    onError: (error: Error) => {
      toast.error('Unable to reject operation', { message: error.message });
    },
  });

  const conflicts = conflictsQuery.data?.conflicts ?? [];

  return (
    <QueryStatePanel
      isLoading={conflictsQuery.isLoading}
      isError={conflictsQuery.isError}
      error={conflictsQuery.error}
      onRetry={() => void conflictsQuery.refetch()}
    >
      <DataTable<SyncConflict>
        variant="executive"
        data={conflicts}
        getRowId={(row) => row.id}
        emptyMessage="No offline sync conflicts awaiting review."
        columns={[
          {
            id: 'operation',
            header: 'Operation',
            cell: (row) => row.operationId,
          },
          {
            id: 'reason',
            header: 'Reason',
            cell: (row) => row.conflictReason,
          },
          {
            id: 'created',
            header: 'Queued',
            cell: (row) => formatDisplayDate(row.createdAt),
          },
          {
            id: 'actions',
            header: 'Actions',
            cell: (row) => (
              <div className="flex flex-wrap gap-wilms-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  onClick={() => approveMutation.mutate(row.id)}
                >
                  Approve
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  onClick={() => rejectMutation.mutate(row.id)}
                >
                  Reject
                </Button>
              </div>
            ),
          },
        ]}
      />
    </QueryStatePanel>
  );
}
