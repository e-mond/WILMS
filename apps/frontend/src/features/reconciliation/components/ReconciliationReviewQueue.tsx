'use client';

import { useMemo, useState } from 'react';
import { CurrencyAmount, DataTable, VarianceAmount } from '@/components/data-display';
import { Alert } from '@/components/feedback/Alert';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import {
  RECONCILIATION_REVIEW_OPTIONS,
  RECONCILIATION_STATUS_LABELS,
  type ReconciliationWorkflowStatus,
} from '@/constants/reconciliation-status';
import type { ReviewReconciliationInput } from '@/types/services';
import {
  useReconciliationList,
  useReviewReconciliation,
} from '@/features/reconciliation/hooks/useReconciliationReview';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import type { ReconciliationSummary } from '@/types/services';
import { resolveUserDisplayId } from '@/utils/entity-display-id';
import { formatDisplayDate } from '@/utils/format-date';
import { cn } from '@/utils/cn';

function needsReconciliationReview(row: ReconciliationSummary): boolean {
  if (!row.submitted) {
    return false;
  }

  if (row.status === 'APPROVED' || row.status === 'REJECTED' || row.status === 'LOCKED') {
    return false;
  }

  return (
    row.varianceFlagged ||
    row.status === 'PENDING_REVIEW' ||
    row.status === 'UNDER_INVESTIGATION' ||
    row.status === 'REOPENED'
  );
}

function statusTone(status?: string): string {
  switch (status) {
    case 'APPROVED':
      return 'text-status-active';
    case 'REJECTED':
      return 'text-danger';
    case 'PENDING_REVIEW':
    case 'UNDER_INVESTIGATION':
      return 'text-status-at-risk';
    case 'REOPENED':
      return 'text-brand-primary';
    default:
      return 'text-text-primary';
  }
}

function ReconciliationReviewRow({
  row,
  onReviewed,
}: {
  row: ReconciliationSummary;
  onReviewed: () => void;
}) {
  const { user } = useAuth();
  const toast = useToast();
  const reviewMutation = useReviewReconciliation();
  const [status, setStatus] = useState<ReviewReconciliationInput['status']>('PENDING_REVIEW');
  const [notes, setNotes] = useState(row.resolutionNotes ?? '');

  if (!row.id || !row.submitted) {
    return null;
  }

  return (
    <div className="rounded-sm border border-border bg-background p-wilms-4">
      <div className="flex flex-wrap items-start justify-between gap-wilms-3">
        <div>
          <p className="font-semibold text-text-primary">
            {formatDisplayDate(row.date)} · Collector {resolveUserDisplayId(row.collectorId)}
          </p>
          <p className={cn('text-small font-semibold', statusTone(row.status))}>
            {RECONCILIATION_STATUS_LABELS[(row.status as ReconciliationWorkflowStatus) ?? 'SUBMITTED'] ??
              row.status ??
              'Submitted'}
          </p>
        </div>
        <VarianceAmount value={row.variancePesewas} />
      </div>

      <dl className="mt-wilms-3 grid gap-wilms-2 text-small sm:grid-cols-3">
        <div>
          <dt className="text-text-muted">Expected</dt>
          <dd><CurrencyAmount value={row.expectedPesewas} /></dd>
        </div>
        <div>
          <dt className="text-text-muted">System recorded</dt>
          <dd><CurrencyAmount value={row.actualPesewas} /></dd>
        </div>
        <div>
          <dt className="text-text-muted">Physical cash</dt>
          <dd><CurrencyAmount value={row.physicalCashPesewas ?? 0} /></dd>
        </div>
      </dl>

      {row.reviewedAt ? (
        <p className="mt-wilms-3 text-small text-text-muted">
          Reviewed {formatDisplayDate(row.reviewedAt)}
          {row.resolutionNotes ? ` — ${row.resolutionNotes}` : ''}
        </p>
      ) : (
        <form
          className="mt-wilms-4 grid gap-wilms-3 lg:grid-cols-[12rem_1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            if (!user?.id) {
              return;
            }

            void reviewMutation
              .mutateAsync({
                id: row.id!,
                input: { status, resolutionNotes: notes.trim() || undefined },
              })
              .then(() => {
                toast.success('Reconciliation updated');
                onReviewed();
              })
              .catch(() => {
                toast.error('Unable to update reconciliation');
              });
          }}
        >
          <Select
            aria-label="Review status"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as ReviewReconciliationInput['status'])
            }
            className="h-10 rounded-sm border border-border bg-card px-wilms-3 text-small"
          >
            {RECONCILIATION_REVIEW_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Input
            aria-label="Resolution notes"
            placeholder="Resolution notes (optional)"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
          <Button type="submit" disabled={reviewMutation.isPending}>
            {reviewMutation.isPending ? 'Saving…' : 'Update status'}
          </Button>
        </form>
      )}
    </div>
  );
}

export function ReconciliationReviewQueue() {
  const { data, isLoading, refetch } = useReconciliationList();
  const pendingReview = useMemo(
    () => (data ?? []).filter(needsReconciliationReview),
    [data],
  );

  if (isLoading) {
    return <LoadingSpinner label="Loading reconciliation queue" className="py-wilms-4" />;
  }

  if (!pendingReview.length) {
    return (
      <Alert title="No reconciliations awaiting review" variant="success">
        Submitted reconciliations with balanced cash will auto-approve. Flagged submissions appear here.
      </Alert>
    );
  }

  return (
    <div className="space-y-wilms-4">
      <div>
        <h2 className="text-heading-2 font-semibold text-text-primary">Reconciliation review queue</h2>
        <p className="text-small text-text-muted">
          Track submitted, pending review, investigation, approval, rejection, and reopening.
        </p>
      </div>

      <DataTable<ReconciliationSummary>
        variant="executive"
        layout="auto"
        caption="Reconciliations awaiting review"
        data={pendingReview}
        getRowId={(row) => row.id ?? `${row.collectorId}-${row.date}`}
        columns={[
          {
            id: 'date',
            header: 'Date',
            className: 'whitespace-nowrap',
            cell: (row) => formatDisplayDate(row.date),
          },
          {
            id: 'collector',
            header: 'Collector',
            className: 'whitespace-nowrap',
            cell: (row) => resolveUserDisplayId(row.collectorId),
          },
          {
            id: 'variance',
            header: 'Variance',
            className: 'whitespace-nowrap tabular-nums',
            cell: (row) => <VarianceAmount value={row.variancePesewas} />,
          },
          {
            id: 'status',
            header: 'Status',
            className: 'whitespace-nowrap',
            cell: (row) => (
              <span className={cn('font-semibold', statusTone(row.status))}>
                {RECONCILIATION_STATUS_LABELS[(row.status as ReconciliationWorkflowStatus) ?? 'SUBMITTED']}
              </span>
            ),
          },
        ]}
      />

      <div className="space-y-wilms-4">
        {pendingReview.map((row) => (
          <ReconciliationReviewRow key={row.id ?? `${row.collectorId}-${row.date}`} row={row} onReviewed={() => void refetch()} />
        ))}
      </div>
    </div>
  );
}
