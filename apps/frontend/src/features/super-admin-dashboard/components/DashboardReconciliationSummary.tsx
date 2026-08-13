'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Clock3 } from 'lucide-react';
import { CurrencyAmount, KpiCard } from '@/components/data-display';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { ExecutiveKpiGrid } from '@/components/layout/executive';
import { useReconciliationList } from '@/features/reconciliation/hooks/useReconciliationReview';
import { needsReconciliationReview } from '@/utils/reconciliation-review';
import { cn } from '@/utils/cn';
import { RECONCILIATION_STATUS_LABELS } from '@/constants/reconciliation-status';

const PENDING_AGING_ICON = <Clock3 className="h-4 w-4" aria-hidden="true" />;

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

export function DashboardReconciliationSummary({ compact = false }: { compact?: boolean }) {
  const { data, isLoading, isError, refetch } = useReconciliationList();
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
      pendingTotal: pending.length,
      approvedToday,
      rejectedToday,
      submittedCount: submitted.length,
      latestPending,
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
      label: 'Pending',
      value: summary.pendingTotal,
      trend: summary.pendingTotal === 0 ? 'Clear' : 'Needs review',
      tone: summary.pendingTotal > 0 ? 'warn' : 'ok',
      icon: PENDING_AGING_ICON,
    },
    {
      label: 'Approved today',
      value: summary.approvedToday,
      trend: summary.approvedToday > 0 ? 'Reviewed' : 'None yet',
      tone: 'ok',
      icon: PENDING_AGING_ICON,
    },
    {
      label: 'Rejected today',
      value: summary.rejectedToday,
      trend: summary.rejectedToday > 0 ? 'Actioned' : 'None yet',
      tone: summary.rejectedToday > 0 ? 'danger' : 'ok',
      icon: PENDING_AGING_ICON,
    },
    {
      label: 'Total submitted',
      value: summary.submittedCount,
      trend: `${summary.pendingTotal} open`,
      tone: 'info' as const,
      icon: undefined,
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

      <ExecutiveKpiGrid
        className={cn(
          compact
            ? 'sm:grid-cols-2 lg:!grid-cols-2 2xl:!grid-cols-2'
            : 'sm:grid-cols-2 xl:grid-cols-4',
        )}
      >
        {metrics.map((metric) => (
          <KpiCard
            key={metric.label}
            variant="executive"
            label={metric.label}
            icon={metric.icon}
            value={metric.value}
            trend={metric.trend}
            valueClassName={cn(
              metric.tone === 'ok' && 'text-status-active',
              metric.tone === 'warn' && 'text-status-at-risk',
              metric.tone === 'danger' && 'text-danger',
              metric.tone === 'info' && 'text-text-primary',
            )}
          />
        ))}
      </ExecutiveKpiGrid>

      <div className="overflow-x-auto rounded-sm border border-border bg-card">
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
            {summary.latestPending.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-wilms-3 py-wilms-4 text-text-muted">
                  No pending reconciliations — all submitted cash reconciliations are clear.
                </td>
              </tr>
            ) : (
              summary.latestPending.map((row) => (
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
