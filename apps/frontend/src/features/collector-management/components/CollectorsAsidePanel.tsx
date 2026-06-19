'use client';

import Link from 'next/link';
import { ActivityFeed, Avatar, SimpleBarChart } from '@/components/data-display';
import { DetailSidebarCard } from '@/components/layout/executive';
import { CollectorAlertIcon } from '@/components/icons/CollectorAlertIcon';
import { CollectorStreakIcon } from '@/components/icons/CollectorStreakIcon';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  COLLECTOR_STATUS,
  type CollectorListResponse,
  type CollectorSummary,
} from '@/types/collector-management';
import { collectorRateBarClass } from '@/utils/collector-rate-display';
import { formatCollectorJoinedDate } from '@/utils/format-collector-date';
import { formatRelativeTime } from '@/utils/format-relative-time';
import { resolveEntityPhotoUrl } from '@/utils/entity-photo';
import { cn } from '@/utils/cn';

export interface CollectorsAsidePanelProps {
  data: CollectorListResponse;
  selected: CollectorSummary | null;
  onMessage: () => void;
}

export function CollectorsAsidePanel({ data, selected, onMessage }: CollectorsAsidePanelProps) {
  return (
    <>
      {selected ? (
        <DetailSidebarCard
          actions={
            <>
              <Button variant="secondary" size="sm" onClick={onMessage}>
                Message
              </Button>
              <Link
                href={`/collectors/${selected.id}`}
                className="inline-flex h-8 items-center justify-center rounded-sm border border-brand-primary bg-brand-primary px-wilms-3 text-small font-semibold text-card hover:opacity-90"
              >
                Full Profile
              </Link>
            </>
          }
        >
          <div className="flex items-center gap-wilms-3">
            <Avatar
              label={selected.displayName}
              photoUrl={resolveEntityPhotoUrl({
                name: selected.displayName,
                id: selected.id,
                photoUrl: selected.photoUrl,
              })}
              size="lg"
            />
            <div className="min-w-0">
              <p className="text-body font-semibold text-text-primary">{selected.displayName}</p>
              <p className="text-small font-semibold text-executive-gold">{selected.id}</p>
              <p className="mt-wilms-1 flex items-center gap-wilms-2 text-small">
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    selected.status === COLLECTOR_STATUS.ACTIVE
                      ? 'bg-status-active'
                      : 'bg-text-muted',
                  )}
                  aria-hidden="true"
                />
                <span className="font-semibold text-text-primary">
                  {selected.status === COLLECTOR_STATUS.ACTIVE ? 'Active' : 'Away'}
                </span>
              </p>
              <p className="text-small text-text-muted">{selected.zone}</p>
            </div>
          </div>

          <dl className="mt-wilms-4 grid grid-cols-2 gap-wilms-3 text-small">
            <div>
              <dt className="text-text-muted">Groups</dt>
              <dd className="font-semibold">{selected.groupCount}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Borrowers</dt>
              <dd className="font-semibold">{selected.borrowerCount}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Cycle</dt>
              <dd className="font-semibold">{selected.cycleLabel}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Last Active</dt>
              <dd className="font-semibold">{formatRelativeTime(selected.lastActiveAt)}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-text-muted">Joined</dt>
              <dd className="font-semibold">{formatCollectorJoinedDate(selected.joinedAt)}</dd>
            </div>
          </dl>

          <div className="mt-wilms-4">
            <ProgressBar
              label="Collection rate"
              value={selected.collectionRatePercent}
              className="mt-wilms-2"
            />
          </div>
          {selected.streakWeeks > 0 ? (
            <p className="mt-wilms-3 inline-flex items-center gap-wilms-2 rounded-sm border border-brand-primary bg-brand-primary-light px-wilms-2 py-wilms-1 text-small font-semibold text-brand-primary">
              <CollectorStreakIcon />
              {selected.streakWeeks}-week collection streak
            </p>
          ) : null}
        </DetailSidebarCard>
      ) : null}

      {selected ? (
        <DetailSidebarCard title="6-Month Performance">
          <div className="mt-wilms-3">
            <SimpleBarChart
              items={selected.monthlyPerformance.map((entry) => ({
                label: entry.monthLabel,
                value: entry.collectionRatePercent,
                barClassName: collectorRateBarClass(entry.collectionRatePercent),
              }))}
            />
          </div>
        </DetailSidebarCard>
      ) : null}

      <DetailSidebarCard title="Team Rate Distribution">
        <ul className="mt-wilms-3 space-y-wilms-2 text-small">
          <li className="flex justify-between">
            <span>≥ 90% — Top performers</span>
            <span className="font-semibold">{data.rateDistribution.topPerformers}</span>
          </li>
          <li className="flex justify-between">
            <span>70–89% — On track</span>
            <span className="font-semibold">{data.rateDistribution.onTrack}</span>
          </li>
          <li className="flex justify-between">
            <span>&lt; 70% — Needs attention</span>
            <span className="font-semibold text-danger">
              {data.rateDistribution.needsAttention}
            </span>
          </li>
        </ul>
      </DetailSidebarCard>

      <DetailSidebarCard title="Collector Alerts">
        <ActivityFeed
          items={data.alerts.map((alert) => ({
            id: alert.id,
            message: alert.message,
            recordedAt: alert.createdAt,
            icon: <CollectorAlertIcon severity={alert.severity} />,
            tone:
              alert.severity === 'danger'
                ? 'danger'
                : alert.severity === 'warning'
                  ? 'warning'
                  : 'success',
          }))}
          className="mt-wilms-3"
        />
      </DetailSidebarCard>
    </>
  );
}
