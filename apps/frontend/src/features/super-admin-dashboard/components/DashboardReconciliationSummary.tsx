'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { KpiCard } from '@/components/data-display';
import { ExecutiveKpiGrid } from '@/components/layout/executive';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { useReconciliationList } from '@/features/reconciliation/hooks/useReconciliationReview';
import { needsReconciliationReview } from '@/utils/reconciliation-review';

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DashboardReconciliationSummary({ compact = false }: { compact?: boolean }) {
  const { data, isLoading, isError, refetch } = useReconciliationList();
  const today = todayIsoDate();

  const summary = useMemo(() => {
    const submitted = (data ?? []).filter((row) => row.submitted);
    const awaitingReview = submitted.filter(needsReconciliationReview);
    const approvedToday = submitted.filter(
      (row) => row.status === 'APPROVED' && row.submittedAt?.slice(0, 10) === today,
    );
    const rejected = submitted.filter((row) => row.status === 'REJECTED');

    return {
      submittedCount: submitted.length,
      awaitingReviewCount: awaitingReview.length,
      approvedTodayCount: approvedToday.length,
      rejectedCount: rejected.length,
    };
  }, [data, today]);

  if (isLoading) {
    return (
      <QueryStatePanel isLoading showLoading isError={false} variant="inline">
        {null}
      </QueryStatePanel>
    );
  }

  if (isError) {
    return (
      <QueryStatePanel
        isLoading={false}
        isError
        onRetry={() => void refetch()}
        variant="inline"
      >
        {null}
      </QueryStatePanel>
    );
  }

  if (compact) {
    return (
      <section className="space-y-wilms-4">
        <div className="flex flex-wrap items-end justify-between gap-wilms-2">
          <div>
            <h3 className="text-heading-3 font-semibold text-text-primary">Reconciliation</h3>
            <p className="text-small text-text-muted">Collector cash submissions and review queue</p>
          </div>
          <Link
            href="/reports/daily-collection"
            className="text-small font-semibold text-brand-primary hover:underline"
          >
            Review queue
          </Link>
        </div>
        <dl className="grid grid-cols-2 gap-wilms-3 text-small sm:grid-cols-4">
          <div className="rounded-sm border border-border bg-background p-wilms-3">
            <dt className="text-text-muted">Awaiting review</dt>
            <dd className="mt-wilms-1 text-heading-3 font-bold tabular-nums text-status-at-risk">
              {summary.awaitingReviewCount}
            </dd>
          </div>
          <div className="rounded-sm border border-border bg-background p-wilms-3">
            <dt className="text-text-muted">Approved today</dt>
            <dd className="mt-wilms-1 text-heading-3 font-bold tabular-nums text-status-active">
              {summary.approvedTodayCount}
            </dd>
          </div>
          <div className="rounded-sm border border-border bg-background p-wilms-3">
            <dt className="text-text-muted">Rejected</dt>
            <dd className="mt-wilms-1 text-heading-3 font-bold tabular-nums text-danger">
              {summary.rejectedCount}
            </dd>
          </div>
          <div className="rounded-sm border border-border bg-background p-wilms-3">
            <dt className="text-text-muted">Total submitted</dt>
            <dd className="mt-wilms-1 text-heading-3 font-bold tabular-nums text-text-primary">
              {summary.submittedCount}
            </dd>
          </div>
        </dl>
      </section>
    );
  }

  return (
    <section className="space-y-wilms-3">
      <h2 className="text-heading-2 font-semibold text-text-primary">Reconciliation Overview</h2>
      <ExecutiveKpiGrid className="sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          variant="executive"
          label="Awaiting review"
          value={summary.awaitingReviewCount}
          valueClassName="text-status-at-risk tabular-nums"
        />
        <KpiCard
          variant="executive"
          label="Approved today"
          value={summary.approvedTodayCount}
          valueClassName="text-status-active tabular-nums"
        />
        <KpiCard
          variant="executive"
          label="Rejected"
          value={summary.rejectedCount}
          valueClassName="text-danger tabular-nums"
        />
        <KpiCard
          variant="executive"
          label="Total submitted"
          value={summary.submittedCount}
          valueClassName="tabular-nums"
        />
      </ExecutiveKpiGrid>
    </section>
  );
}
