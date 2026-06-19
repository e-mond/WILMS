'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  ActivityFeed,
  CurrencyAmount,
  GroupRiskBadge,
  KpiCard,
} from '@/components/data-display';
import { DetailSidebarCard } from '@/components/layout/executive';
import { Button } from '@/components/ui/Button';
import { GROUP_RISK_DISPLAY } from '@/constants/group-risk-display';
import { GROUP_RISK_LEVEL } from '@/types/group';
import type { GroupDetail } from '@/types/group-detail';
import { formatRelativeTime } from '@/utils/format-relative-time';

export interface GroupProfileAsidePanelProps {
  group: GroupDetail;
}

export function GroupProfileAsidePanel({ group }: GroupProfileAsidePanelProps) {
  return (
    <>
      <DetailSidebarCard title="Group Health Summary">
        <div className="mt-wilms-3 space-y-wilms-3">
          <GroupRiskBadge riskLevel={group.riskLevel} />
          <KpiCard
            variant="executive"
            label="Repayment Rate"
            value={`${group.repaymentPerformancePercent}%`}
            valueClassName="text-status-active"
          />
          <ProfileMetric label="Active loans" value={String(group.activeLoanCount)} />
          <ProfileMetric
            label="Outstanding"
            value={<CurrencyAmount value={group.outstandingPesewas} />}
          />
        </div>
      </DetailSidebarCard>

      <DetailSidebarCard title="Risk Indicators">
        <ul className="mt-wilms-3 space-y-wilms-2 text-small">
          <li className="flex justify-between">
            <span>{GROUP_RISK_DISPLAY[GROUP_RISK_LEVEL.LOW_RISK].label}</span>
            <span className="font-semibold">
              {group.riskLevel === GROUP_RISK_LEVEL.LOW_RISK ? 'Current' : '—'}
            </span>
          </li>
          <li className="flex justify-between">
            <span>Collection rate</span>
            <span className="font-semibold">{group.collectionRatePercent}%</span>
          </li>
          <li className="flex justify-between">
            <span>Active members</span>
            <span className="font-semibold">
              {group.activeMemberCount}/{group.memberCount}
            </span>
          </li>
        </ul>
      </DetailSidebarCard>

      <DetailSidebarCard title="Collector Summary">
        <dl className="mt-wilms-3 space-y-wilms-2 text-small">
          <div>
            <dt className="text-text-muted">Collector</dt>
            <dd className="font-semibold">{group.collector.fullName}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Zone</dt>
            <dd className="font-semibold">{group.collector.zone}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Collection rate</dt>
            <dd className="font-semibold">{group.collector.collectionRatePercent}%</dd>
          </div>
          <div>
            <dt className="text-text-muted">Last active</dt>
            <dd className="font-semibold">{formatRelativeTime(group.collector.lastActiveAt)}</dd>
          </div>
        </dl>
      </DetailSidebarCard>

      <DetailSidebarCard title="Recent Activity">
        <ActivityFeed items={group.recentActivity} className="mt-wilms-3" />
      </DetailSidebarCard>

      <DetailSidebarCard title="Quick Actions">
        <div className="mt-wilms-3 flex flex-col gap-wilms-2">
          <Link href={`/collectors/${group.collector.id}`}>
            <Button variant="secondary" size="sm" className="w-full">
              View Collector
            </Button>
          </Link>
          <Link href={`/borrowers/${group.leader.borrowerId}`}>
            <Button variant="secondary" size="sm" className="w-full">
              View Group Leader
            </Button>
          </Link>
          <Link href="/groups">
            <Button variant="ghost" size="sm" className="w-full">
              Back to Groups
            </Button>
          </Link>
        </div>
      </DetailSidebarCard>
    </>
  );
}

function ProfileMetric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-small text-text-muted">{label}</p>
      <p className="font-semibold text-text-primary">{value}</p>
    </div>
  );
}
