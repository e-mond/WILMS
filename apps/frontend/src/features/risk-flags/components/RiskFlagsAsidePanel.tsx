'use client';

import Link from 'next/link';
import {
  ActivityTimeline,
  Avatar,
  CurrencyAmount,
  FlagBadge,
  MetricDistributionChart,
} from '@/components/data-display';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { PERMISSION } from '@/constants/permissions';
import { DetailSidebarCard } from '@/components/layout/executive';
import { FLAG_ENTITY_TYPE_DISPLAY } from '@/constants/entity-type-display';
import { FLAG_STATUS_DISPLAY } from '@/constants/risk-flag-display';
import { resolvePersonPhotoUrl } from '@/utils/person-photo';
import {
  FLAG_STATUS,
  FLAG_TYPE,
  type FlagTimelineEvent,
  type RiskFlagListResponse,
  type RiskFlagSummary,
} from '@/types/risk-flag';
import { formatDisplayDate } from '@/utils/format-date';

const FLAG_TYPE_TONE = {
  [FLAG_TYPE.MISSED_PAYMENT]: 'warning',
  [FLAG_TYPE.DEFAULT]: 'danger',
  [FLAG_TYPE.FRAUD_SUSPICION]: 'primary',
  [FLAG_TYPE.DUPLICATE_ID]: 'blacklisted',
  [FLAG_TYPE.BLACKLISTED]: 'blacklisted',
} as const;

function mapTimelineEvents(events: FlagTimelineEvent[]) {
  return events.map((event, index) => ({
    id: event.id,
    message: event.message,
    recordedAt: formatDisplayDate(event.recordedAt.slice(0, 10)),
    tone:
      index === 0 ? ('danger' as const) : index === 1 ? ('warning' as const) : ('primary' as const),
  }));
}

export interface RiskFlagsAsidePanelProps {
  data: RiskFlagListResponse;
  selected: RiskFlagSummary | null;
  timeline: FlagTimelineEvent[];
  onEscalate: () => void;
  onResolve: () => void;
  onAssign: () => void;
}

export function RiskFlagsAsidePanel({
  data,
  selected,
  timeline,
  onEscalate,
  onResolve,
  onAssign,
}: RiskFlagsAsidePanelProps) {
  const criticalCount = data.flags.filter((flag) => flag.status === FLAG_STATUS.CRITICAL).length;
  const reviewQueueCount = data.flags.filter((flag) => flag.status === FLAG_STATUS.UNDER_REVIEW).length;

  return (
    <>
      {selected ? (
        <DetailSidebarCard
          eyebrow={selected.id}
          title={selected.entityName}
          subtitle={`${selected.entityId} · ${selected.community}`}
        >
          <div className="mt-wilms-3 flex flex-wrap gap-wilms-2">
            <FlagBadge flagType={selected.flagType} />
            <Badge variant={FLAG_STATUS_DISPLAY[selected.status].variant}>
              {FLAG_STATUS_DISPLAY[selected.status].label}
            </Badge>
            {selected.flagType === FLAG_TYPE.DEFAULT ? (
              <Badge variant="danger">Default</Badge>
            ) : null}
            {selected.status === FLAG_STATUS.OPEN ? (
              <Badge variant="warning">Open</Badge>
            ) : null}
          </div>

          <dl className="mt-wilms-4 grid grid-cols-2 gap-wilms-3 text-small">
            <div>
              <dt className="text-text-muted">Officer</dt>
              <dd className="font-semibold">{selected.officerName}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Community</dt>
              <dd className="font-semibold">{selected.community}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Weeks Overdue</dt>
              <dd className="font-semibold text-danger">
                {selected.weeksOverdue ? `${selected.weeksOverdue} weeks` : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-text-muted">Arrears</dt>
              <dd className="font-semibold text-danger">
                <CurrencyAmount value={selected.arrearsPesewas} />
              </dd>
            </div>
            <div>
              <dt className="text-text-muted">Members</dt>
              <dd className="font-semibold">
                {selected.activeMembers != null && selected.totalMembers != null
                  ? `${selected.activeMembers}/${selected.totalMembers}`
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-text-muted">Raised</dt>
              <dd className="font-semibold">{formatDisplayDate(selected.raisedAt)}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Group</dt>
              <dd className="font-semibold">{selected.groupName ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Entity Type</dt>
              <dd className="font-semibold">{FLAG_ENTITY_TYPE_DISPLAY[selected.entityType]}</dd>
            </div>
          </dl>

          {timeline.length ? (
            <div className="mt-wilms-4">
              <p className="text-small font-semibold text-text-primary">Flag Timeline</p>
              <ActivityTimeline events={mapTimelineEvents(timeline)} className="mt-wilms-3" />
            </div>
          ) : null}

          <div className="mt-wilms-4 space-y-wilms-2">
            <PermissionGate permission={PERMISSION.REVIEW_RISK_FLAGS}>
              <Button variant="danger" size="sm" className="w-full" onClick={onEscalate}>
                Escalate to Blacklist
              </Button>
              <div className="grid grid-cols-2 gap-wilms-2">
                <Button variant="secondary" size="sm" onClick={onResolve}>
                  Mark Resolved
                </Button>
                <Button variant="secondary" size="sm" onClick={onAssign}>
                  Assign Officer
                </Button>
              </div>
            </PermissionGate>
          </div>
        </DetailSidebarCard>
      ) : null}

      <DetailSidebarCard title="Active Alerts">
        <ul className="mt-wilms-3 space-y-wilms-2 text-small">
          <li className="flex justify-between">
            <span>Open flags</span>
            <span className="font-semibold text-danger">{data.summary.openFlags}</span>
          </li>
          <li className="flex justify-between">
            <span>Critical escalations</span>
            <span className="font-semibold text-danger">{criticalCount}</span>
          </li>
          <li className="flex justify-between">
            <span>Resolution queue</span>
            <span className="font-semibold">{reviewQueueCount}</span>
          </li>
        </ul>
      </DetailSidebarCard>

      <DetailSidebarCard title="Flag Type Breakdown">
        <MetricDistributionChart
          className="mt-wilms-3"
          items={data.typeBreakdown.map((entry) => ({
            id: entry.flagType,
            label: entry.label,
            count: entry.count,
            tone: FLAG_TYPE_TONE[entry.flagType],
          }))}
        />
      </DetailSidebarCard>

      <DetailSidebarCard title="Recent Blacklistings">
        <div className="mt-wilms-1 flex items-center justify-end">
          <Link
            href="/reports/defaulters"
            className="text-small font-semibold text-brand-primary hover:underline"
          >
            View all
          </Link>
        </div>
        <ul className="mt-wilms-3 space-y-wilms-3 text-small">
          {data.recentBlacklists.map((entry) => (
            <li key={entry.id} className="flex items-start gap-wilms-3">
              <Avatar
                label={entry.name}
                photoUrl={resolvePersonPhotoUrl({ name: entry.name, id: entry.id })}
                size="sm"
              />
              <div>
                <p className="font-semibold text-text-primary">{entry.name}</p>
                <p className="text-text-muted">{entry.reason}</p>
                <p className="text-text-muted">{formatDisplayDate(entry.blacklistedAt)}</p>
              </div>
            </li>
          ))}
        </ul>
      </DetailSidebarCard>
    </>
  );
}
