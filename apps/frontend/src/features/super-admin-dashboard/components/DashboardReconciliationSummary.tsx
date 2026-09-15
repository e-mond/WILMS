'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CurrencyAmount } from '@/components/data-display';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { useReconciliationList } from '@/features/reconciliation/hooks/useReconciliationReview';
import { reconciliationService } from '@/services';
import { needsReconciliationReview } from '@/utils/reconciliation-review';
import { cn } from '@/utils/cn';
import { RECONCILIATION_STATUS_LABELS } from '@/constants/reconciliation-status';

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function ageDays(iso: string | undefined, now: Date): number {
  if (!iso) return 0;
  const submitted = startOfDay(new Date(iso));
  const today = startOfDay(now);
  return Math.max(0, Math.round((today.getTime() - submitted.getTime()) / 86_400_000));
}

function isSameDay(iso: string | undefined, now: Date): boolean {
  if (!iso) return false;
  return ageDays(iso, now) === 0;
}

function pluralizeCollectors(count: number): string {
  return count === 1 ? '1 collector' : `${count} collectors`;
}

export function DashboardReconciliationSummary({ compact = false }: { compact?: boolean }) {
  const { data, isLoading, isError, refetch } = useReconciliationList();
  const opsQuery = useQuery({
    queryKey: ['reconciliations', 'ops-snapshot'],
    queryFn: () => reconciliationService.getReconciliationOpsSnapshot(),
    staleTime: 30_000,
  });
  const now = useMemo(() => new Date(), []);

  const summary = useMemo(() => {
    const submitted = (data ?? []).filter((row) => row.submitted);
    const pending = submitted.filter(needsReconciliationReview);

    const approvedToday = submitted.filter(
      (row) => row.status === 'APPROVED' && isSameDay(row.reviewedAt ?? row.submittedAt, now),
    ).length;
    const rejectedToday = submitted.filter(
      (row) => row.status === 'REJECTED' && isSameDay(row.reviewedAt ?? row.submittedAt, now),
    ).length;

    const latestPending = [...pending]
      .sort((a, b) => String(b.submittedAt ?? '').localeCompare(String(a.submittedAt ?? '')))
      .slice(0, 5)
      .map((row) => ({
        id: row.id ?? `${row.collectorId}-${row.date}`,
        collectorLabel: row.collectorLabel ?? row.collectorId,
        date: row.date,
        amountPesewas: row.physicalCashPesewas ?? row.actualPesewas,
        age: ageDays(row.submittedAt, now),
        status: row.status ?? 'PENDING_REVIEW',
        submittedAt: row.submittedAt,
      }));

    return {
      pendingTotal: opsQuery.data?.pendingReview ?? pending.length,
      missingRecent: opsQuery.data?.missingRecentSubmissions ?? 0,
      windowDays: opsQuery.data?.windowDays ?? 7,
      approvedToday: opsQuery.data?.approvedToday ?? approvedToday,
      rejectedToday: opsQuery.data?.rejectedToday ?? rejectedToday,
      submittedCount: opsQuery.data?.submittedCount ?? submitted.length,
      latestPending,
    };
  }, [data, now, opsQuery.data]);

  if (isLoading) {
    return (
      <div data-testid="dashboard-reconciliation-summary">
        <QueryStatePanel isLoading showLoading isError={false} variant="inline">
          {null}
        </QueryStatePanel>
      </div>
    );
  }

  if (isError) {
    return (
      <div data-testid="dashboard-reconciliation-summary">
        <QueryStatePanel isLoading={false} isError onRetry={() => void refetch()} variant="inline">
          {null}
        </QueryStatePanel>
      </div>
    );
  }

  const metrics = [
    {
      label: 'Pending review',
      value: summary.pendingTotal,
      tone: summary.pendingTotal > 0 ? 'warn' : 'ok',
    },
    {
      label: `Missing (${summary.windowDays}d)`,
      value: summary.missingRecent,
      tone: summary.missingRecent > 0 ? 'danger' : 'ok',
    },
    {
      label: 'Approved today',
      value: summary.approvedToday,
      tone: 'ok',
    },
    {
      label: 'Rejected today',
      value: summary.rejectedToday,
      tone: summary.rejectedToday > 0 ? 'danger' : 'ok',
    },
  ] as const;

  return (
    <section
      className={cn(
        'space-y-wilms-4 rounded-sm border border-border bg-card p-wilms-5',
        !compact && 'p-wilms-6',
      )}
      data-testid="dashboard-reconciliation-summary"
      data-financial-tone="reconciliation"
      aria-labelledby="reconciliation-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-wilms-3">
        <div className="min-w-0">
          <h3 id="reconciliation-heading" className="text-heading-3 font-semibold text-text-primary">
            Reconciliation
          </h3>
          <p className="mt-wilms-1 text-small text-text-muted">
            Submitted reconciliations awaiting review, plus collectors with no submission in the
            last {summary.windowDays} days. Age is days since the cash sheet was submitted.
          </p>
        </div>
        <Link
          href="/reports/daily-collection"
          className="shrink-0 whitespace-nowrap text-small font-semibold text-brand-primary hover:underline"
        >
          View all reconciliations →
        </Link>
      </div>

      <dl className="grid grid-cols-2 gap-wilms-3 sm:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-sm border border-border bg-background p-wilms-3"
          >
            <dt className="text-small font-medium text-text-muted">{metric.label}</dt>
            <dd
              className={cn(
                'mt-wilms-1 text-heading-2 font-semibold tabular-nums',
                metric.tone === 'ok' && 'text-status-active',
                metric.tone === 'warn' && 'text-status-at-risk',
                metric.tone === 'danger' && 'text-danger',
              )}
            >
              {metric.value.toLocaleString()}
            </dd>
          </div>
        ))}
      </dl>

      <div>
        <h4 className="mb-wilms-2 text-small font-semibold uppercase tracking-wide text-text-muted">
          Latest pending reconciliations
        </h4>
        {summary.latestPending.length === 0 ? (
          <div className="rounded-sm border border-dashed border-border px-wilms-4 py-wilms-5 text-center">
            <p className="text-body font-medium text-text-primary">No pending reconciliations</p>
            <p className="mt-wilms-1 text-small text-text-muted">
              All submitted cash sheets have been reviewed.
            </p>
            {summary.missingRecent > 0 ? (
              <p className="mt-wilms-2 text-small text-text-muted">
                {pluralizeCollectors(summary.missingRecent)}{' '}
                {summary.missingRecent === 1 ? 'has' : 'have'} not submitted in the last{' '}
                {summary.windowDays} days. Review Missing ({summary.windowDays}d) above.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-sm border border-border">
            <table className="min-w-full text-left text-small">
              <caption className="sr-only">Latest pending reconciliations</caption>
              <thead className="border-b border-border bg-background/60 text-text-muted">
                <tr>
                  <th className="whitespace-nowrap px-wilms-3 py-wilms-2 font-semibold">Collector</th>
                  <th className="whitespace-nowrap px-wilms-3 py-wilms-2 font-semibold">Date</th>
                  <th className="whitespace-nowrap px-wilms-3 py-wilms-2 font-semibold">Amount</th>
                  <th className="whitespace-nowrap px-wilms-3 py-wilms-2 font-semibold">Age</th>
                  <th className="whitespace-nowrap px-wilms-3 py-wilms-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {summary.latestPending.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="whitespace-nowrap px-wilms-3 py-wilms-2 font-medium text-text-primary">
                      {row.collectorLabel}
                    </td>
                    <td className="whitespace-nowrap px-wilms-3 py-wilms-2 text-text-muted">
                      {row.date}
                    </td>
                    <td className="whitespace-nowrap px-wilms-3 py-wilms-2 tabular-nums text-text-primary">
                      <CurrencyAmount value={row.amountPesewas} />
                    </td>
                    <td className="whitespace-nowrap px-wilms-3 py-wilms-2 text-text-muted">
                      {row.age === 0 ? 'Today' : `${row.age}d`}
                    </td>
                    <td className="whitespace-nowrap px-wilms-3 py-wilms-2 text-text-muted">
                      {RECONCILIATION_STATUS_LABELS[
                        row.status as keyof typeof RECONCILIATION_STATUS_LABELS
                      ] ?? row.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
