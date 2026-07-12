'use client';

import { ActivityFeed, CurrencyAmount, UtilisationBar } from '@/components/data-display';
import { DetailSidebarCard } from '@/components/layout/executive';
import type { GroupActivity } from '@/types/group';
import type { LoanPoolAllocationSegment, LoanPoolSummary } from '@/types/loan-pool';
import { resolvePoolDisplayId } from '@/utils/entity-display-id';

export interface LoanPoolsAsidePanelProps {
  selected: LoanPoolSummary | null;
  allocation: readonly LoanPoolAllocationSegment[];
  recentActivity: readonly GroupActivity[];
}

export function LoanPoolsAsidePanel({
  selected,
  allocation,
  recentActivity,
}: LoanPoolsAsidePanelProps) {
  return (
    <>
      {selected ? (
        <DetailSidebarCard
          eyebrow={resolvePoolDisplayId(selected)}
          title={selected.name}
          subtitle={`${selected.region} · ${selected.source}`}
        >
          <div className="mt-wilms-4">
            <p className="text-small text-text-muted">Pool utilisation</p>
            <UtilisationBar percent={selected.utilisationPercent} className="mt-wilms-2" />
            <p className="mt-wilms-2 text-small text-text-muted">
              <CurrencyAmount value={selected.disbursedPesewas} /> out of{' '}
              <CurrencyAmount value={selected.capitalPesewas} />
            </p>
          </div>
          <dl className="mt-wilms-4 grid grid-cols-2 gap-wilms-3 text-small">
            <div>
              <dt className="text-text-muted">Collected</dt>
              <dd className="font-semibold">
                <CurrencyAmount value={selected.collectedPesewas} />
              </dd>
            </div>
            <div>
              <dt className="text-text-muted">Outstanding</dt>
              <dd className="font-semibold">
                <CurrencyAmount value={selected.outstandingPesewas} />
              </dd>
            </div>
            <div>
              <dt className="text-text-muted">Groups</dt>
              <dd className="font-semibold">{selected.groupCount}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Repay rate</dt>
              <dd className="font-semibold">{selected.repaymentRatePercent}%</dd>
            </div>
          </dl>
        </DetailSidebarCard>
      ) : null}
      <DetailSidebarCard title="Fund Allocation by Pool">
        <ul className="mt-wilms-3 space-y-wilms-3 text-small">
          {allocation.map((segment) => (
            <li key={segment.poolId}>
              <div className="flex items-center justify-between gap-wilms-2">
                <span className="text-text-muted">{segment.poolName}</span>
                <span className="font-semibold text-brand-primary">{segment.percent}%</span>
              </div>
              <div className="mt-wilms-1 h-2 rounded-sm bg-background">
                <div
                  className="h-2 rounded-sm bg-brand-primary"
                  style={{ width: `${segment.percent}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </DetailSidebarCard>
      <DetailSidebarCard title="Recent Pool Activity">
        <ActivityFeed items={recentActivity} className="mt-wilms-3" />
      </DetailSidebarCard>
    </>
  );
}
