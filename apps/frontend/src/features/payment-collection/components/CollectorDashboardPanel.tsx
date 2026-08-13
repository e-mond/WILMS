'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import {
  Avatar,
  CollectorPaymentStatusBadge,
  CurrencyAmount,
  DataTable,
  KpiCard,
} from '@/components/data-display';
import { resolveKpiIcon } from '@/components/data-display/resolveKpiIcon';
import { Alert } from '@/components/feedback/Alert';
import { EmptyState } from '@/components/feedback/EmptyState';
import { InlinePanelSkeleton } from '@/components/feedback/PageSkeletons';
import { DetailSidebarCard, ExecutiveKpiGrid } from '@/components/layout/executive';
import { ExecutiveDetailLayout } from '@/components/layout/ExecutiveDetailLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useCollectorDashboard } from '@/features/payment-collection/hooks/useCollectorDashboard';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/types/api';
import {
  RECONCILIATION_STATUS,
  type CollectorDashboardBorrower,
  type CollectorRecentPayment,
  type CollectorTodayGroup,
} from '@/types/collector-dashboard';
import { resolveGroupDisplayId } from '@/utils/entity-display-id';
import { formatDisplayDate } from '@/utils/format-date';
import { cn } from '@/utils/cn';
import { resolveQueryErrorPresentation } from '@/utils/query-error-presentation';

function reconciliationLabel(status: string): string {
  switch (status) {
    case RECONCILIATION_STATUS.COMPLETE:
      return 'Approved';
    case RECONCILIATION_STATUS.VARIANCE:
      return 'Variance flagged';
    case RECONCILIATION_STATUS.REJECTED:
      return 'Rejected';
    case RECONCILIATION_STATUS.IN_REVIEW:
      return 'In review';
    default:
      return 'Pending';
  }
}

function formatTime(isoDateTime: string): string {
  return new Date(isoDateTime).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function MetricTile({
  label,
  value,
  valueClassName,
  href,
}: {
  label: string;
  value: ReactNode;
  valueClassName?: string;
  href?: string;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-wilms-2">
        <p className="text-small text-text-muted">{label}</p>
        <span className="rounded-md bg-background p-1 text-text-muted" aria-hidden="true">
          {resolveKpiIcon(label)}
        </span>
      </div>
      <p className={cn('mt-wilms-1 text-body font-bold text-text-primary', valueClassName)}>{value}</p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="flex min-h-[72px] flex-col justify-center rounded-xl border border-border bg-card px-wilms-3 py-wilms-2 transition-colors hover:border-brand-primary hover:bg-brand-primary-light"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="flex min-h-[72px] flex-col justify-center rounded-xl border border-border bg-card px-wilms-3 py-wilms-2">
      {content}
    </div>
  );
}

function TodayGroupCard({ group }: { group: CollectorTodayGroup }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="flex h-full min-w-0 flex-col rounded-sm border border-border/70 bg-card p-wilms-4">
      <div className="flex items-start gap-wilms-3">
        <Avatar label={group.groupName} photoUrl={group.groupPhotoUrl} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-wilms-2">
            <div className="min-w-0">
              <h3 className="truncate text-body font-semibold text-text-primary">{group.groupName}</h3>
              <p className="truncate text-small text-text-muted">
                {group.community} · {resolveGroupDisplayId({ id: group.groupId })}
              </p>
              <p className="mt-wilms-1 text-small text-text-muted">Leader: {group.leaderName}</p>
            </div>
            <span className="shrink-0 rounded-sm border border-border px-wilms-2 py-wilms-1 text-small font-semibold text-text-primary">
              {group.status}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-wilms-4 space-y-wilms-2">
        <div className="flex items-center justify-between text-small text-text-muted">
          <span>
            {group.collectedCount}/{group.expectedCount} paid · {group.pendingCount} pending
          </span>
          <span>{group.progressPercent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-sm bg-background">
          <div className="h-full bg-brand-primary" style={{ width: `${group.progressPercent}%` }} />
        </div>
      </div>

      <div className="mt-wilms-4 grid grid-cols-2 gap-wilms-2 text-small">
        <div>
          <p className="text-text-muted">Expected</p>
          <CurrencyAmount value={group.expectedPesewas} />
        </div>
        <div>
          <p className="text-text-muted">Collected</p>
          <CurrencyAmount value={group.amountCollectedPesewas} className="text-status-active" />
        </div>
      </div>

      <button
        type="button"
        className="mt-wilms-3 min-h-[44px] text-left text-small font-semibold text-brand-primary md:hidden"
        onClick={() => setExpanded((current) => !current)}
      >
        {expanded ? 'Hide details' : 'View details'}
      </button>

      <div className={cn('mt-wilms-3 flex flex-wrap gap-wilms-2', !expanded && 'hidden md:flex')}>
        <Link
          href={`/collector/groups/${group.groupId}/collection-sheet`}
          className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-sm border border-brand-primary px-wilms-3 py-wilms-2 text-small font-semibold text-brand-primary hover:bg-brand-primary-light"
        >
          Open collection
        </Link>
      </div>
    </article>
  );
}

function RecentPaymentRow({ payment }: { payment: CollectorRecentPayment }) {
  return (
    <li className="flex items-center gap-wilms-3 border-b border-border py-wilms-3 last:border-b-0">
      <Avatar label={payment.borrowerName} photoUrl={payment.borrowerPhotoUrl} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-text-primary">{payment.borrowerName}</p>
        <p className="truncate text-small text-text-muted">
          {payment.groupName} · {formatTime(payment.recordedAt)}
          {payment.gpsSummary ? ` · ${payment.gpsSummary}` : ''}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <CurrencyAmount value={payment.amountPesewas} className="text-status-active" />
        <CollectorPaymentStatusBadge status={payment.status} />
      </div>
    </li>
  );
}

export function CollectorDashboardPanel() {
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch, isFetching } = useCollectorDashboard(user?.id);

  if (isLoading) {
    return <InlinePanelSkeleton />;
  }

  if (isError) {
    const isForbidden = error instanceof ApiError && error.status === 403;
    const presentation = isForbidden
      ? {
          title: 'Access denied',
          description:
            'Your account does not have permission to view this collector dashboard. Sign in as a collector or contact your administrator.',
          canRetry: false,
        }
      : resolveQueryErrorPresentation(error);

    return (
      <EmptyState
        title={presentation.title}
        description={presentation.description}
        action={
          presentation.canRetry ? (
            <button
              type="button"
              className="text-small font-semibold text-brand-primary"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              {isFetching ? 'Retrying…' : 'Retry'}
            </button>
          ) : undefined
        }
      />
    );
  }

  if (!data) {
    return <InlinePanelSkeleton />;
  }

  const { summary, hero, alerts, todayGroups, recentPayments, stats, borrowers } = data;
  const pendingBorrowers = borrowers.filter((entry) => entry.paymentStatus !== 'COLLECTED');

  return (
    <div className="min-w-0 space-y-wilms-5" data-testid="collector-field-dashboard">
      <section className="overflow-hidden rounded-2xl border border-border/80 bg-card p-wilms-4 shadow-[var(--shadow-card)] sm:p-wilms-5">
        <div className="flex flex-col gap-wilms-4">
          <div className="min-w-0">
            <p className="text-small font-semibold uppercase tracking-wide text-brand-primary">
              Today&apos;s collection
            </p>
            <p className="mt-wilms-1 break-words text-heading-1 font-semibold text-text-primary">
              <CurrencyAmount value={summary.collectedPesewas} />
            </p>
            <p className="mt-wilms-2 text-small text-text-muted">
              Target <CurrencyAmount value={hero.targetPesewas} /> · {hero.progressPercent}% achieved ·{' '}
              {formatDisplayDate(summary.date)} · {summary.paymentDayLabel}
              {summary.nextCollectionDueDate
                ? ` · Next due ${formatDisplayDate(summary.nextCollectionDueDate)}`
                : null}
            </p>
            <div
              className="mt-wilms-3 h-2 max-w-md overflow-hidden rounded-full bg-background"
              role="progressbar"
              aria-valuenow={hero.progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Today collection progress"
            >
              <div
                className="h-full rounded-full bg-brand-primary motion-safe:transition-[width] motion-safe:duration-500"
                style={{ width: `${Math.min(100, Math.max(0, hero.progressPercent))}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-wilms-2 sm:grid-cols-3 lg:grid-cols-6">
            <MetricTile
              label="Paid"
              value={hero.paidBorrowers}
              valueClassName="text-status-active"
              href="/collector/my-borrowers?status=COLLECTED"
            />
            <MetricTile
              label="Pending"
              value={hero.pendingBorrowers}
              href="/collector/my-borrowers?status=PENDING"
            />
            <MetricTile
              label="Overdue"
              value={hero.overdueBorrowers}
              valueClassName="text-danger"
              href="/collector/my-borrowers?status=MISSED"
            />
            <MetricTile label="Groups today" value={hero.groupsToday} />
            <MetricTile label="Streak" value={`${hero.streakDays} days`} />
            <MetricTile
              label="Weekly trend"
              value={`${hero.weeklyTrendPercent >= 0 ? '+' : ''}${hero.weeklyTrendPercent}%`}
              valueClassName={hero.weeklyTrendPercent >= 0 ? 'text-status-active' : 'text-danger'}
            />
          </div>
        </div>
      </section>

      {alerts.length > 0 ? (
        <div className="-mx-wilms-1 flex gap-wilms-2 overflow-x-auto px-wilms-1 pb-wilms-1" aria-label="Operational alerts">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                'shrink-0 rounded-full border px-wilms-3 py-wilms-2 text-small font-semibold',
                alert.tone === 'error' && 'border-danger bg-danger/10 text-danger',
                alert.tone === 'warning' && 'border-status-at-risk bg-status-at-risk-light text-status-at-risk',
                alert.tone === 'info' && 'border-status-info bg-status-info-light text-status-info',
              )}
            >
              {alert.message}
            </div>
          ))}
        </div>
      ) : null}

      <ExecutiveKpiGrid className="grid-cols-2 lg:grid-cols-4">
        <KpiCard
          variant="executive"
          label="Outstanding"
          value={<CurrencyAmount value={summary.outstandingPesewas} />}
          valueClassName="text-danger"
        />
        <KpiCard
          variant="executive"
          label="Collection rate"
          value={`${summary.collectionRatePercent}%`}
        />
        <KpiCard variant="executive" label="Borrowers managed" value={stats.borrowersManaged} />
        <KpiCard
          variant="executive"
          label="Reconciliation"
          value={reconciliationLabel(summary.reconciliationStatus)}
        />
      </ExecutiveKpiGrid>

      <ExecutiveDetailLayout
        sidebar={
          <div className="space-y-wilms-3">
            <DetailSidebarCard title="Recent payments">
              <ul className="mt-wilms-2">
                {recentPayments.length > 0 ? (
                  recentPayments.map((payment) => (
                    <RecentPaymentRow
                      key={`${payment.borrowerId}-${payment.recordedAt}`}
                      payment={payment}
                    />
                  ))
                ) : (
                  <li className="py-wilms-3 text-small text-text-muted">
                    No payments recorded yet today.
                  </li>
                )}
              </ul>
            </DetailSidebarCard>
            <DetailSidebarCard title="Workload">
              <dl className="mt-wilms-2 space-y-wilms-2 text-small">
                <div className="flex justify-between gap-wilms-2">
                  <dt className="text-text-muted">Payments recorded</dt>
                  <dd className="font-semibold text-text-primary">{stats.paymentsRecorded}</dd>
                </div>
                <div className="flex justify-between gap-wilms-2">
                  <dt className="text-text-muted">Groups assigned</dt>
                  <dd className="font-semibold text-text-primary">{stats.groupsAssigned}</dd>
                </div>
                <div className="flex justify-between gap-wilms-2">
                  <dt className="text-text-muted">Still due today</dt>
                  <dd className="font-semibold text-text-primary">{pendingBorrowers.length}</dd>
                </div>
              </dl>
            </DetailSidebarCard>
          </div>
        }
      >
        <Card className="w-full min-w-0">
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-wilms-2">
            <CardTitle>Today&apos;s Groups</CardTitle>
            <p className="text-small text-text-muted">
              {todayGroups.length} group{todayGroups.length === 1 ? '' : 's'}
            </p>
          </CardHeader>
          <CardContent>
          {todayGroups.length === 0 ? (
            <EmptyState
              title="No groups due today"
              description={`No assigned groups have ${summary.paymentDayLabel} as their payment day.`}
            />
          ) : (
            <div className="grid w-full min-w-0 gap-wilms-3 sm:grid-cols-2">
              {todayGroups.map((group) => (
                <TodayGroupCard key={group.groupId} group={group} />
              ))}
            </div>
          )}
          </CardContent>
        </Card>

        <section className="mt-wilms-6 space-y-wilms-3">
          <div className="flex flex-wrap items-center justify-between gap-wilms-2">
            <h2 className="text-heading-3 font-semibold text-text-primary">Borrowers due today</h2>
            {pendingBorrowers.length > 0 ? (
              <Link
                href="/collector/my-borrowers?status=PENDING"
                className="text-small font-semibold text-brand-primary"
              >
                View all pending
              </Link>
            ) : null}
          </div>
          {borrowers.length === 0 ? (
            <EmptyState
              title="No collections scheduled today"
              description={`No borrowers have ${summary.paymentDayLabel} as their assigned payment day.`}
            />
          ) : (
            <DataTable<CollectorDashboardBorrower>
              variant="executive"
              mobileLayout="stack"
              caption="Borrowers due for collection today"
              data={borrowers}
              getRowId={(row) => row.borrowerId}
              columns={[
                {
                  id: 'borrower',
                  header: 'Borrower',
                  priority: 'primary',
                  cell: (row) => (
                    <div className="flex items-center gap-wilms-3">
                      <Avatar label={row.borrowerName} photoUrl={row.borrowerPhotoUrl} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-text-primary">{row.borrowerName}</p>
                        <p className="truncate text-small text-text-muted">{row.groupName}</p>
                      </div>
                    </div>
                  ),
                },
                {
                  id: 'expected',
                  header: 'Expected',
                  priority: 'secondary',
                  cell: (row) => <CurrencyAmount value={row.expectedPesewas} />,
                },
                {
                  id: 'collected',
                  header: 'Collected',
                  priority: 'secondary',
                  cell: (row) => (
                    <CurrencyAmount value={row.collectedPesewas} className="text-status-active" />
                  ),
                },
                {
                  id: 'status',
                  header: 'Status',
                  priority: 'meta',
                  cell: (row) => <CollectorPaymentStatusBadge status={row.paymentStatus} />,
                },
                {
                  id: 'action',
                  header: 'Action',
                  priority: 'meta',
                  cell: (row) => (
                    <Link
                      href={`/collector/payment/${row.borrowerId}`}
                      className="text-small font-semibold text-brand-primary hover:underline"
                    >
                      Record payment
                    </Link>
                  ),
                },
              ]}
            />
          )}
        </section>

        {summary.reconciliationStatus !== RECONCILIATION_STATUS.COMPLETE ? (
          <Alert
            title={
              summary.reconciliationStatus === RECONCILIATION_STATUS.REJECTED
                ? 'Reconciliation rejected'
                : summary.reconciliationStatus === RECONCILIATION_STATUS.VARIANCE
                  ? 'Reconciliation variance flagged'
                  : summary.reconciliationStatus === RECONCILIATION_STATUS.IN_REVIEW
                    ? 'Reconciliation in review'
                    : 'Reconciliation pending'
            }
            variant={
              summary.reconciliationStatus === RECONCILIATION_STATUS.REJECTED
                ? 'error'
                : 'warning'
            }
            className="mt-wilms-4"
          >
            Reconciliation: {reconciliationLabel(summary.reconciliationStatus)}. Open Reconcile when
            you are ready to submit today&apos;s collections.
          </Alert>
        ) : null}
      </ExecutiveDetailLayout>
    </div>
  );
}
