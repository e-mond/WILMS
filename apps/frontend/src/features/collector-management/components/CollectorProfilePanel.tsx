'use client';

import Link from 'next/link';
import { CurrencyAmount, DataTable, KpiCard, Avatar } from '@/components/data-display';
import { EmptyState } from '@/components/feedback/EmptyState';
import { QueryErrorState } from '@/components/feedback/QueryErrorState';
import { InlinePanelSkeleton } from '@/components/feedback/PageSkeletons';
import { DetailSidebarCard, ExecutiveKpiGrid } from '@/components/layout/executive';
import { ExecutiveDetailLayout } from '@/components/layout/ExecutiveDetailLayout';
import { useCollector } from '@/features/collector-management/hooks/useCollector';
import type { CollectorMonthlyPerformance } from '@/types/collector-management';
import { formatDisplayDate } from '@/utils/format-date';
import { resolveCollectorDisplayId, resolveGroupDisplayId } from '@/utils/entity-display-id';
import { resolveEntityPhotoUrl } from '@/utils/entity-photo';

export interface CollectorProfilePanelProps {
  collectorId: string;
}

export function CollectorProfilePanel({ collectorId }: CollectorProfilePanelProps) {
  const { data, isLoading, isError, error, refetch } = useCollector(collectorId);

  if (isLoading) {
    return <InlinePanelSkeleton />;
  }

  if (isError) {
    return (
      <QueryErrorState
        error={error}
        onRetry={() => void refetch()}
        title="Collector not found"
        description="This collector may have been removed or the link is invalid."
      />
    );
  }

  if (!data) {
    return (
      <EmptyState
        title="Collector not found"
        description="This collector may have been removed or the link is invalid."
        action={
          <Link href="/collectors" className="text-small font-semibold text-brand-primary hover:underline">
            Back to collectors
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-wilms-4">
      <div className="flex flex-wrap items-start gap-wilms-4 rounded-sm border border-border bg-card p-wilms-4">
        <Avatar
          label={data.displayName}
          photoUrl={resolveEntityPhotoUrl({
            name: data.displayName,
            id: data.id,
            photoUrl: data.photoUrl,
          })}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-heading-1 font-semibold text-text-primary">{data.displayName}</h1>
          <p className="text-body text-text-muted">Collector · {data.zone}</p>
          <p className="mt-wilms-1 text-small font-semibold text-executive-gold">
            {resolveCollectorDisplayId(data)}
          </p>
          <p className="mt-wilms-1 text-small text-text-muted">
            Community coverage · Joined {formatDisplayDate(data.joinedAt)} · {data.cycleLabel}
          </p>
          <p className="mt-wilms-1 text-small font-semibold text-status-active">Active</p>
        </div>
      </div>

      <ExecutiveKpiGrid>
        <KpiCard variant="executive" label="Collection rate" value={`${data.collectionRatePercent}%`} />
        <KpiCard variant="executive" label="Assigned groups" value={data.groupCount} />
        <KpiCard variant="executive" label="Assigned borrowers" value={data.borrowerCount} />
        <KpiCard variant="executive" label="Recovery rate" value={`${data.recoveryRatePercent}%`} />
        <KpiCard
          variant="executive"
          label="Collected"
          value={<CurrencyAmount value={data.collectedPesewas} />}
        />
        <KpiCard variant="executive" label="Reconciliations" value={data.reconciliationCount} />
        <KpiCard variant="executive" label="Expenses submitted" value={data.expensesSubmittedCount} />
      </ExecutiveKpiGrid>

      <ExecutiveDetailLayout
        sidebar={
          <>
            <DetailSidebarCard title="Recent collections">
              <ul className="mt-wilms-3 space-y-wilms-2 text-small">
                {data.recentCollections.length ? (
                  data.recentCollections.map((entry) => (
                    <li key={entry.id} className="text-text-primary">
                      {entry.message}
                    </li>
                  ))
                ) : (
                  <li className="text-text-muted">No recent collections recorded.</li>
                )}
              </ul>
            </DetailSidebarCard>
            <DetailSidebarCard title="Flags raised">
              <ul className="mt-wilms-3 space-y-wilms-2 text-small">
                {data.flagsRaised.length ? (
                  data.flagsRaised.map((entry) => (
                    <li key={entry.id} className="text-danger">
                      {entry.message}
                    </li>
                  ))
                ) : (
                  <li className="text-text-muted">No active flags.</li>
                )}
              </ul>
            </DetailSidebarCard>
            <DetailSidebarCard title="Activity">
              <ul className="mt-wilms-3 space-y-wilms-2 text-small text-text-muted">
                {data.activityHistory.length ? (
                  data.activityHistory.map((entry) => (
                    <li key={entry.id}>{entry.message}</li>
                  ))
                ) : (
                  <li>No recent activity.</li>
                )}
              </ul>
            </DetailSidebarCard>
          </>
        }
      >
        <section className="space-y-wilms-4">
          <h2 className="text-heading-3 font-semibold text-text-primary">Group performance</h2>
          <DataTable
            variant="executive"
            caption="Assigned groups"
            data={data.assignedGroups}
            getRowId={(row) => row.id}
            columns={[
              {
                id: 'groupId',
                header: 'Group ID',
                cell: (row) => resolveGroupDisplayId(row),
              },
              { id: 'name', header: 'Group', cell: (row) => row.name },
              { id: 'members', header: 'Members', cell: (row) => row.memberCount },
              { id: 'trend', header: 'Repayment trend', cell: (row) => row.repaymentTrend },
              { id: 'risk', header: 'Risk level', cell: (row) => row.riskLevel },
            ]}
          />
        </section>

        <DataTable<CollectorMonthlyPerformance>
          variant="executive"
          caption="Monthly collection performance"
          data={data.monthlyPerformance}
          getRowId={(row) => row.monthLabel}
          columns={[
            { id: 'month', header: 'Month', cell: (row) => row.monthLabel },
            {
              id: 'rate',
              header: 'Collection rate',
              cell: (row) => `${row.collectionRatePercent}%`,
            },
          ]}
        />
      </ExecutiveDetailLayout>
    </div>
  );
}
