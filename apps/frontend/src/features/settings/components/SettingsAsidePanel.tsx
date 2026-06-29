'use client';

import { Avatar } from '@/components/data-display';
import { DetailSidebarCard } from '@/components/layout/executive';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { useSettingsActivity } from '@/features/settings/hooks/useSettingsActivity';
import { formatDisplayDate } from '@/utils/format-date';
import { getAppVersionLabel } from '@/lib/app-version';
import { resolvePersonPhotoUrl } from '@/utils/person-photo';

export interface SettingsAsidePanelProps {
  updatedAt: string;
  activeSectionLabel: string;
}

export function SettingsAsidePanel({ updatedAt, activeSectionLabel }: SettingsAsidePanelProps) {
  const { data: activity, isLoading } = useSettingsActivity();

  return (
    <>
      <DetailSidebarCard title="System Status">
        <dl className="mt-wilms-3 space-y-wilms-2 text-small">
          <div>
            <dt className="text-text-muted">Environment</dt>
            <dd className="font-semibold">Demo · Development</dd>
          </div>
          <div>
            <dt className="text-text-muted">Core services</dt>
            <dd className="font-semibold text-status-active">Operational</dd>
          </div>
          <div>
            <dt className="text-text-muted">Application version</dt>
            <dd className="font-semibold">{getAppVersionLabel() || '—'}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Last settings sync</dt>
            <dd className="font-semibold">{formatDisplayDate(updatedAt.slice(0, 10))}</dd>
          </div>
        </dl>
      </DetailSidebarCard>
      <DetailSidebarCard title="Recent Changes">
        {isLoading || !activity ? (
          <LoadingSpinner label="Loading recent changes" className="mt-wilms-3 py-wilms-2" />
        ) : (
          <ul className="mt-wilms-3 space-y-wilms-2 text-small">
            {activity.map((entry) => (
              <li key={entry.id} className="flex items-start gap-wilms-3">
                <Avatar
                  label={entry.actorLabel}
                  photoUrl={resolvePersonPhotoUrl({ name: entry.actorLabel, id: entry.id })}
                  size="sm"
                />
                <div>
                  <p className="font-semibold text-text-primary">{entry.title}</p>
                  <p className="text-text-muted">
                    {formatDisplayDate(entry.occurredAt)} · {entry.actorLabel}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DetailSidebarCard>
      <DetailSidebarCard title="Audit Activity">
        <p className="mt-wilms-3 text-small text-text-muted">
          Viewing <span className="font-semibold text-text-primary">{activeSectionLabel}</span>{' '}
          configuration. All changes are logged to the audit trail in production.
        </p>
      </DetailSidebarCard>
    </>
  );
}
