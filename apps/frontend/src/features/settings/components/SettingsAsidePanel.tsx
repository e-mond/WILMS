'use client';

import { Avatar } from '@/components/data-display';
import { DetailSidebarCard } from '@/components/layout/executive';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { useSettingsActivity } from '@/features/settings/hooks/useSettingsActivity';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { isDemoMode } from '@/data-provider/types';
import { formatDisplayDate } from '@/utils/format-date';
import { getAppVersionLabel } from '@/lib/app-version';
import { getWilmsEnvironment } from '@/features/export/utils/environment';
import { resolvePersonPhotoUrl } from '@/utils/person-photo';

export interface SettingsAsidePanelProps {
  updatedAt: string;
  activeSectionLabel: string;
}

function formatEnvironmentLabel(environment?: string): string {
  const clientEnv = getWilmsEnvironment();
  if (isDemoMode()) {
    return `Demo · ${clientEnv}`;
  }
  if (environment) {
    return environment.charAt(0).toUpperCase() + environment.slice(1);
  }
  return clientEnv;
}

function formatCoreServicesLabel(status: string): string {
  if (status === 'healthy') {
    return 'Operational';
  }
  if (status === 'degraded') {
    return 'Degraded';
  }
  return 'Offline';
}

export function SettingsAsidePanel({ updatedAt, activeSectionLabel }: SettingsAsidePanelProps) {
  const { data: activity, isLoading } = useSettingsActivity();
  const { status, environment } = useSystemStatus();

  return (
    <>
      <DetailSidebarCard title="System Status">
        <dl className="mt-wilms-3 space-y-wilms-2 text-small">
          <div>
            <dt className="text-text-muted">Environment</dt>
            <dd className="font-semibold">{formatEnvironmentLabel(environment)}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Core services</dt>
            <dd
              className={
                status === 'healthy'
                  ? 'font-semibold text-status-active'
                  : status === 'degraded'
                    ? 'font-semibold text-warning'
                    : 'font-semibold text-text-muted'
              }
            >
              {formatCoreServicesLabel(status)}
            </dd>
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
