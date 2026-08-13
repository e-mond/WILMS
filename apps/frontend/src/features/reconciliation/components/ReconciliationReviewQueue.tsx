'use client';

import { useEffect, useMemo, useState } from 'react';
import { CurrencyAmount, DataTable, VarianceAmount } from '@/components/data-display';
import { Alert } from '@/components/feedback/Alert';
import { InlinePanelSkeleton } from '@/components/feedback/PageSkeletons';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
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
import { ExportCsvButton } from '@/features/reports/components/ExportCsvButton';
import { WILMS_REPORT_TYPE } from '@/features/export';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import type { ReconciliationSummary } from '@/types/services';
import { resolveUserDisplayId } from '@/utils/entity-display-id';
import { formatDisplayDate } from '@/utils/format-date';
import { formatPesewasForCsv } from '@/utils/export-csv';
import { needsReconciliationReview } from '@/utils/reconciliation-review';

function statusVariant(status?: string): BadgeVariant {
  switch (status) {
    case 'APPROVED':
      return 'success';
    case 'REJECTED':
      return 'danger';
    case 'PENDING_REVIEW':
    case 'UNDER_INVESTIGATION':
      return 'warning';
    case 'REOPENED':
      return 'primary';
    default:
      return 'pending';
  }
}

function ReconciliationReviewDrawer({
  row,
  isOpen,
  onClose,
  onReviewed,
}: {
  row: ReconciliationSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onReviewed: () => void;
}) {
  const { user } = useAuth();
  const toast = useToast();
  const reviewMutation = useReviewReconciliation();
  const [status, setStatus] = useState<ReviewReconciliationInput['status']>('PENDING_REVIEW');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (row) {
      setStatus('PENDING_REVIEW');
      setNotes(row.resolutionNotes ?? '');
    }
  }, [row]);

  if (!row?.id || !row.submitted) {
    return null;
  }

  const label =
    RECONCILIATION_STATUS_LABELS[(row.status as ReconciliationWorkflowStatus) ?? 'SUBMITTED'] ??
    row.status ??
    'Submitted';

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`${formatDisplayDate(row.date)} · ${row.collectorLabel ?? resolveUserDisplayId(row.collectorId)}`}
      side="right"
      width="w-full max-w-md"
    >
      <div className="space-y-wilms-4 p-wilms-4">
        <div className="flex flex-wrap items-center justify-between gap-wilms-2">
          <Badge variant={statusVariant(row.status)}>{label}</Badge>
          <VarianceAmount value={row.variancePesewas} />
        </div>

        <dl className="grid grid-cols-2 gap-wilms-3 text-small">
          <div>
            <dt className="text-text-muted">Expected</dt>
            <dd className="mt-0.5 font-semibold">
              <CurrencyAmount value={row.expectedPesewas} />
            </dd>
          </div>
          <div>
            <dt className="text-text-muted">System recorded</dt>
            <dd className="mt-0.5 font-semibold">
              <CurrencyAmount value={row.actualPesewas} />
            </dd>
          </div>
          <div>
            <dt className="text-text-muted">Physical cash</dt>
            <dd className="mt-0.5 font-semibold">
              <CurrencyAmount value={row.physicalCashPesewas ?? 0} />
            </dd>
          </div>
          <div>
            <dt className="text-text-muted">Variance</dt>
            <dd className="mt-0.5 font-semibold">
              <VarianceAmount value={row.variancePesewas} />
            </dd>
          </div>
        </dl>

        {row.collectionGps && row.collectionGps.length > 0 ? (
          <div className="space-y-wilms-2">
            <p className="text-small font-semibold text-text-primary">Collection GPS</p>
            <ul className="space-y-wilms-1 text-small text-text-muted">
              {row.collectionGps.map((entry, index) => (
                <li key={`${entry.capturedAt ?? 'gps'}-${index}`}>{entry.summary}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-small text-text-muted">No GPS captures recorded for this day.</p>
        )}

        {row.reviewedAt ? (
          <p className="text-small text-text-muted">
            Reviewed {formatDisplayDate(row.reviewedAt)}
            {row.resolutionNotes ? ` — ${row.resolutionNotes}` : ''}
          </p>
        ) : (
          <form
            className="space-y-wilms-3"
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
                  onClose();
                })
                .catch(() => {
                  toast.error('Unable to update reconciliation');
                });
            }}
          >
            <label className="block text-small font-semibold text-text-primary">
              Review status
              <Select
                aria-label="Review status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as ReviewReconciliationInput['status'])
                }
                className="mt-wilms-2 h-10 w-full rounded-xl border border-border bg-card px-wilms-3 text-small"
              >
                {RECONCILIATION_REVIEW_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block text-small font-semibold text-text-primary">
              Resolution notes
              <Input
                aria-label="Resolution notes"
                className="mt-wilms-2"
                placeholder="Optional notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </label>
            <Button type="submit" className="w-full" disabled={reviewMutation.isPending}>
              {reviewMutation.isPending ? 'Saving…' : 'Update status'}
            </Button>
          </form>
        )}
      </div>
    </Drawer>
  );
}

export function ReconciliationReviewQueue() {
  const { data, isLoading, refetch } = useReconciliationList();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const allPending = useMemo(() => (data ?? []).filter(needsReconciliationReview), [data]);

  const pendingReview = useMemo(() => {
    if (statusFilter === 'ALL') return allPending;
    return allPending.filter((row) => row.status === statusFilter);
  }, [allPending, statusFilter]);

  const selectedRow = useMemo(
    () => pendingReview.find((row) => (row.id ?? `${row.collectorId}-${row.date}`) === selectedId) ?? null,
    [pendingReview, selectedId],
  );

  if (isLoading) {
    return <InlinePanelSkeleton />;
  }

  if (!allPending.length) {
    return (
      <Alert title="No reconciliations pending" variant="success">
        Balanced cash submissions auto-approve. Flagged variance submissions appear here as Pending.
      </Alert>
    );
  }

  return (
    <div className="space-y-wilms-4">
      <div className="flex flex-wrap items-end justify-between gap-wilms-3">
        <div>
          <h2 className="text-heading-2 font-semibold text-text-primary">Pending reconciliations</h2>
          <p className="text-small text-text-muted">
            Review variance submissions. Select a row for expected vs collected detail.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-wilms-2">
          <label className="block text-small text-text-muted">
            Status
            <Select
              className="mt-1 h-10 min-w-[10rem] rounded-xl border border-border bg-card px-wilms-3 text-small"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
            >
              <option value="ALL">All pending</option>
              {RECONCILIATION_REVIEW_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </label>
          <ExportCsvButton
            label="Export queue"
            filename={`WILMS_Reconciliation_Report_${new Date().toISOString().slice(0, 10)}.csv`}
            reportType={WILMS_REPORT_TYPE.GENERIC_REPORT}
            reportTitle="Reconciliation Pending Queue"
            headers={['Date', 'Collector', 'Expected (GHS)', 'Physical (GHS)', 'Variance (GHS)', 'GPS Captures', 'Status']}
            rows={pendingReview.map((row) => [
              row.date,
              row.collectorLabel ?? resolveUserDisplayId(row.collectorId),
              formatPesewasForCsv(row.expectedPesewas),
              formatPesewasForCsv(row.physicalCashPesewas ?? row.actualPesewas),
              formatPesewasForCsv(row.variancePesewas),
              row.collectionGps?.map((entry) => entry.summary).join(' | ') || 'Not captured',
              String(row.status ?? 'SUBMITTED'),
            ])}
          />
        </div>
      </div>

      {pendingReview.length === 0 ? (
        <Alert title="No rows match this filter" variant="info">
          Clear the status filter to see all pending reconciliations.
        </Alert>
      ) : (
        <DataTable<ReconciliationSummary>
          variant="executive"
          layout="auto"
          mobileLayout="stack"
          caption="Pending reconciliations"
          data={pendingReview}
          selectedRowId={selectedId}
          onRowClick={(row) => setSelectedId(row.id ?? `${row.collectorId}-${row.date}`)}
          getRowId={(row) => row.id ?? `${row.collectorId}-${row.date}`}
          getRowAriaLabel={(row) =>
            `Reconciliation ${formatDisplayDate(row.date)} for ${resolveUserDisplayId(row.collectorId)}`
          }
          columns={[
            {
              id: 'date',
              header: 'Date',
              priority: 'primary',
              className: 'whitespace-nowrap',
              cell: (row) => formatDisplayDate(row.date),
            },
            {
              id: 'collector',
              header: 'Collector',
              priority: 'secondary',
              className: 'whitespace-nowrap',
              cell: (row) => row.collectorLabel ?? resolveUserDisplayId(row.collectorId),
            },
            {
              id: 'expected',
              header: 'Expected',
              priority: 'secondary',
              className: 'whitespace-nowrap tabular-nums',
              cell: (row) => <CurrencyAmount value={row.expectedPesewas} />,
            },
            {
              id: 'physical',
              header: 'Physical',
              priority: 'secondary',
              className: 'whitespace-nowrap tabular-nums',
              cell: (row) => <CurrencyAmount value={row.physicalCashPesewas ?? row.actualPesewas} />,
            },
            {
              id: 'variance',
              header: 'Variance',
              priority: 'secondary',
              className: 'whitespace-nowrap tabular-nums',
              cell: (row) => <VarianceAmount value={row.variancePesewas} />,
            },
            {
              id: 'gps',
              header: 'GPS',
              priority: 'meta',
              cell: (row) =>
                row.collectionGps?.length
                  ? `${row.collectionGps.length} capture${row.collectionGps.length === 1 ? '' : 's'}`
                  : '—',
            },
            {
              id: 'status',
              header: 'Status',
              priority: 'meta',
              className: 'whitespace-nowrap',
              cell: (row) => (
                <Badge variant={statusVariant(row.status)}>
                  {RECONCILIATION_STATUS_LABELS[
                    (row.status as ReconciliationWorkflowStatus) ?? 'SUBMITTED'
                  ]}
                </Badge>
              ),
            },
          ]}
        />
      )}

      <ReconciliationReviewDrawer
        row={selectedRow}
        isOpen={Boolean(selectedRow)}
        onClose={() => setSelectedId(null)}
        onReviewed={() => void refetch()}
      />
    </div>
  );
}
