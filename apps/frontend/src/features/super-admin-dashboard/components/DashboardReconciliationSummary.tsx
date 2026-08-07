'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { CurrencyAmount } from '@/components/data-display';
import { useReconciliationList } from '@/features/reconciliation/hooks/useReconciliationReview';
import { needsReconciliationReview } from '@/utils/reconciliation-review';
import { cn } from '@/utils/cn';

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function ageDays(iso: string | undefined, now: Date): number {
  if (!iso) return 0;
  const submitted = startOfDay(new Date(iso));
  const today = startOfDay(now);
  return Math.max(0, Math.round((today.getTime() - submitted.getTime()) / 86_400_000));
}

export function DashboardReconciliationSummary({ compact = false }: { compact?: boolean }) {
  const { data, isLoading, isError, refetch } = useReconciliationList();
  const now = useMemo(() => new Date(), []);

  const summary = useMemo(() => {
    const submitted = (data ?? []).filter((row) => row.submitted);
    const pending = submitted.filter(needsReconciliationReview);

    const pendingToday = pending.filter((row) => ageDays(row.submittedAt, now) === 0).length;
    const pendingOver1 = pending.filter((row) => ageDays(row.submittedAt, now) > 1).length;
    const pendingOver3 = pending.filter((row) => ageDays(row.submittedAt, now) > 3).length;

    const latestPending = [...pending]
      .sort((a, b) => String(b.submittedAt ?? '').localeCompare(String(a.submittedAt ?? '')))
      .slice(0, 5)
      .map((row) => ({
        id: row.id ?? `${row.collectorId}-${row.date}`,
        collectorId: row.collectorId,
        date: row.date,
        amountPesewas: row.physicalCashPesewas ?? row.actualPesewas,
        age: ageDays(row.submittedAt, now),
        submittedAt: row.submittedAt,
      }));

    return {
      pendingToday,
      pendingOver1,
      pendingOver3,
      submittedCount: submitted.length,
      latestPending,
      pendingTotal: pending.length,
    };
  }, [data, now]);

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
      label: 'Pending Today',
      value: summary.pendingToday,
      trend: summary.pendingToday === 0 ? 'Clear' : 'Needs review',
      tone: summary.pendingToday > 0 ? 'warn' : 'ok',
    },
    {
      label: 'Pending >1 Day',
      value: summary.pendingOver1,
      trend: summary.pendingOver1 > 0 ? 'Aging' : 'Stable',
      tone: summary.pendingOver1 > 0 ? 'warn' : 'ok',
    },
    {
      label: 'Pending >3 Days',
      value: summary.pendingOver3,
      trend: summary.pendingOver3 > 0 ? 'Escalate' : 'Stable',
      tone: summary.pendingOver3 > 0 ? 'danger' : 'ok',
    },
    {
      label: 'Total Submitted',
      value: summary.submittedCount,
      trend: `${summary.pendingTotal} open`,
      tone: 'info' as const,
    },
  ] as const;

  return (
    <section
      className={cn(
        'space-y-wilms-5 rounded-sm border border-[color-mix(in_srgb,var(--color-status-info)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-status-info)_8%,var(--color-card))] p-wilms-5',
        !compact && 'p-wilms-6',
      )}
      data-testid="dashboard-reconciliation-summary"
      data-financial-tone="reconciliation"
    >
      <div className="flex flex-wrap items-end justify-between gap-wilms-3">
        <div className="min-w-0">
          <p className="text-small font-semibold uppercase tracking-wide text-status-info">
            Reconciliation
          </p>
          <h3 className="text-heading-3 font-semibold text-text-primary">Pending queue</h3>
          <p className="mt-wilms-1 text-small text-text-muted">
            Collector cash submissions awaiting review
          </p>
        </div>
        <Link
          href="/reports/daily-collection"
          className="shrink-0 whitespace-nowrap text-small font-semibold text-status-info hover:underline"
        >
          View all reconciliations
        </Link>
      </div>

      <dl className="grid gap-wilms-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-sm border border-border/70 bg-card/80 px-wilms-4 py-wilms-4"
          >
            <dt className="whitespace-nowrap text-small font-semibold text-text-muted">
              {metric.label}
            </dt>
            <dd
              className={cn(
                'mt-wilms-2 text-heading-2 font-bold tabular-nums whitespace-nowrap',
                metric.tone === 'ok' && 'text-status-active',
                metric.tone === 'warn' && 'text-status-at-risk',
                metric.tone === 'danger' && 'text-danger',
                metric.tone === 'info' && 'text-text-primary',
              )}
            >
              {metric.value}
            </dd>
            <p className="mt-wilms-2 whitespace-nowrap text-small text-text-muted">{metric.trend}</p>
          </div>
        ))}
      </dl>

      <div className="overflow-x-auto rounded-sm border border-border bg-card">
        <table className="min-w-full text-left text-small">
          <caption className="sr-only">Latest pending reconciliations</caption>
          <thead className="border-b border-border bg-background/60 text-text-muted">
            <tr>
              <th className="whitespace-nowrap px-wilms-3 py-wilms-2 font-semibold">Collector</th>
              <th className="whitespace-nowrap px-wilms-3 py-wilms-2 font-semibold">Date</th>
              <th className="whitespace-nowrap px-wilms-3 py-wilms-2 font-semibold">Amount</th>
              <th className="whitespace-nowrap px-wilms-3 py-wilms-2 font-semibold">Age</th>
            </tr>
          </thead>
          <tbody>
            {summary.latestPending.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-wilms-3 py-wilms-4 text-text-muted">
                  No pending reconciliations
                </td>
              </tr>
            ) : (
              summary.latestPending.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="whitespace-nowrap px-wilms-3 py-wilms-2 font-medium text-text-primary">
                    {row.collectorId}
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
