'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { QueryErrorState } from '@/components/feedback/QueryErrorState';
import { InlinePanelSkeleton } from '@/components/feedback/PageSkeletons';
import { borrowerUpdatesService } from '@/services/borrowerUpdatesService';
import { useCollectorBorrowers } from '@/features/payment-collection/hooks/useCollectorBorrowers';
import {
  BORROWER_UPDATE_FIELD_LABELS,
  BORROWER_UPDATE_FIELDS,
  type BorrowerUpdateRequest,
} from '@/types/borrower-updates';
import { formatDisplayDate } from '@/utils/format-date';
import { useToast } from '@/hooks/useToast';

const requestsQueryKey = ['borrower-update-requests', 'mine'] as const;

function statusVariant(status: BorrowerUpdateRequest['status']) {
  if (status === 'APPROVED') return 'success' as const;
  if (status === 'REJECTED') return 'danger' as const;
  return 'primary' as const;
}

export function CollectorBorrowerUpdatePanel() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data: borrowers } = useCollectorBorrowers();
  const [borrowerId, setBorrowerId] = useState('');
  const [field, setField] = useState<(typeof BORROWER_UPDATE_FIELDS)[number]>('PHONE');
  const [afterValue, setAfterValue] = useState('');
  const [reason, setReason] = useState('');

  const requestsQuery = useQuery({
    queryKey: requestsQueryKey,
    queryFn: () => borrowerUpdatesService.listRequests({ mine: true }),
  });

  const assignedBorrowers = useMemo(() => borrowers ?? [], [borrowers]);

  const createMutation = useMutation({
    mutationFn: () =>
      borrowerUpdatesService.createRequest({
        borrowerId,
        field,
        afterValue: afterValue.trim(),
        reason: reason.trim(),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: requestsQueryKey });
      setAfterValue('');
      setReason('');
      toast.success('Update request submitted');
    },
    onError: (error: unknown) => {
      toast.error('Unable to submit request', {
        message: error instanceof Error ? error.message : 'Try again shortly.',
      });
    },
  });

  if (requestsQuery.isLoading) {
    return <InlinePanelSkeleton />;
  }

  if (requestsQuery.isError) {
    return (
      <QueryErrorState
        error={requestsQuery.error}
        onRetry={() => void requestsQuery.refetch()}
        title="Unable to load update requests"
      />
    );
  }

  return (
    <div className="space-y-wilms-4">
      <Card>
        <CardHeader>
          <CardTitle>Request a borrower update</CardTitle>
          <CardDescription>
            Collectors cannot edit borrower records directly. Submit a change for Registration Officer
            or Super Admin review.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-wilms-3">
          <label className="block text-small font-semibold text-text-primary" htmlFor="update-borrower">
            Borrower
          </label>
          <select
            id="update-borrower"
            className="h-10 w-full rounded-sm border border-border bg-card px-wilms-3 text-body text-text-primary"
            value={borrowerId}
            onChange={(event) => setBorrowerId(event.target.value)}
          >
            <option value="">Select borrower</option>
            {assignedBorrowers.map((borrower) => (
              <option key={borrower.borrowerId} value={borrower.borrowerId}>
                {borrower.borrowerName}
              </option>
            ))}
          </select>
          <label className="block text-small font-semibold text-text-primary" htmlFor="update-field">
            Field
          </label>
          <select
            id="update-field"
            className="h-10 w-full rounded-sm border border-border bg-card px-wilms-3 text-body text-text-primary"
            value={field}
            onChange={(event) =>
              setField(event.target.value as (typeof BORROWER_UPDATE_FIELDS)[number])
            }
          >
            {BORROWER_UPDATE_FIELDS.map((entry) => (
              <option key={entry} value={entry}>
                {BORROWER_UPDATE_FIELD_LABELS[entry]}
              </option>
            ))}
          </select>
          <label className="block text-small font-semibold text-text-primary" htmlFor="update-value">
            Proposed value
          </label>
          <Input
            id="update-value"
            value={afterValue}
            onChange={(event) => setAfterValue(event.target.value)}
            maxLength={120}
          />
          <label className="block text-small font-semibold text-text-primary" htmlFor="update-reason">
            Reason
          </label>
          <Textarea
            id="update-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={200}
          />
          <Button
            type="button"
            disabled={!borrowerId || !afterValue.trim() || reason.trim().length < 3 || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            Submit request
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-wilms-3">
          {(requestsQuery.data?.requests ?? []).length === 0 ? (
            <p className="text-body text-text-muted">No borrower update requests yet.</p>
          ) : (
            (requestsQuery.data?.requests ?? []).map((request) => (
              <div key={request.id} className="rounded-sm border border-border bg-card p-wilms-3">
                <div className="flex flex-wrap items-center justify-between gap-wilms-2">
                  <p className="font-semibold text-text-primary">
                    {BORROWER_UPDATE_FIELD_LABELS[request.field]}
                  </p>
                  <Badge variant={statusVariant(request.status)}>{request.status}</Badge>
                </div>
                <p className="mt-wilms-1 text-small text-text-muted">
                  {request.beforeValue || '—'} → {request.afterValue}
                </p>
                <p className="text-small text-text-muted">{formatDisplayDate(request.createdAt)}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
