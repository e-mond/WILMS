'use client';

import { useQuery } from '@tanstack/react-query';
import { DetailSidebarCard } from '@/components/layout/executive';
import { intelligenceService } from '@/services/intelligenceService';
import type { MaintenanceWindow, OperationalIncident } from '@/types/intelligence';
import { formatDisplayDate } from '@/utils/format-date';

function maintenanceTiming(window: MaintenanceWindow, nowMs: number): 'active' | 'scheduled' | 'past' {
  const start = Date.parse(window.startsAt);
  const end = Date.parse(window.endsAt);
  if (Number.isFinite(start) && Number.isFinite(end)) {
    if (nowMs >= start && nowMs <= end) return 'active';
    if (nowMs < start) return 'scheduled';
  }
  return 'past';
}

function IncidentList({ incidents }: { incidents: OperationalIncident[] }) {
  if (incidents.length === 0) {
    return <p className="mt-wilms-2 text-small text-text-muted">No incidents recorded.</p>;
  }

  return (
    <ul className="mt-wilms-2 space-y-wilms-3">
      {incidents.slice(0, 8).map((incident) => (
        <li key={incident.id} className="border-b border-border/60 pb-wilms-2 last:border-0 last:pb-0">
          <p className="text-small font-semibold text-text-primary">{incident.title}</p>
          <p className="text-small text-text-muted">
            {incident.severity} · {incident.status}
            {incident.openedAt ? ` · ${formatDisplayDate(incident.openedAt.slice(0, 10))}` : ''}
          </p>
        </li>
      ))}
    </ul>
  );
}

function MaintenanceList({
  windows,
  emptyLabel,
}: {
  windows: MaintenanceWindow[];
  emptyLabel: string;
}) {
  if (windows.length === 0) {
    return <p className="mt-wilms-2 text-small text-text-muted">{emptyLabel}</p>;
  }

  return (
    <ul className="mt-wilms-2 space-y-wilms-3">
      {windows.slice(0, 6).map((window) => (
        <li key={window.id} className="border-b border-border/60 pb-wilms-2 last:border-0 last:pb-0">
          <p className="text-small font-semibold text-text-primary">{window.title}</p>
          <p className="text-small text-text-muted">
            {formatDisplayDate(window.startsAt.slice(0, 10))} –{' '}
            {formatDisplayDate(window.endsAt.slice(0, 10))}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function OperationsAsidePanel() {
  const nowMs = Date.now();

  const incidentsQuery = useQuery({
    queryKey: ['ops', 'incidents'] as const,
    queryFn: () => intelligenceService.listIncidents(),
    retry: 1,
  });

  const maintenanceQuery = useQuery({
    queryKey: ['ops', 'maintenance'] as const,
    queryFn: () => intelligenceService.listMaintenanceWindows(),
    retry: 1,
  });

  const incidents = (incidentsQuery.data ?? []) as OperationalIncident[];
  const openIncidents = incidents.filter((item) => item.status !== 'RESOLVED');
  const resolvedIncidents = incidents.filter((item) => item.status === 'RESOLVED');

  const windows = (maintenanceQuery.data ?? []) as MaintenanceWindow[];
  const scheduledOrActive = windows.filter((item) => {
    const timing = maintenanceTiming(item, nowMs);
    return timing === 'scheduled' || timing === 'active';
  });
  const pastWindows = windows.filter((item) => maintenanceTiming(item, nowMs) === 'past');

  return (
    <div className="space-y-wilms-3" data-testid="ops-aside-panel">
      <DetailSidebarCard
        eyebrow="Operations"
        title="Incidents"
        subtitle={
          openIncidents.length > 0
            ? `${openIncidents.length} open`
            : 'No open incidents'
        }
      >
        <IncidentList incidents={openIncidents.length > 0 ? openIncidents : resolvedIncidents} />
      </DetailSidebarCard>

      <DetailSidebarCard title="Scheduled maintenance" subtitle="Upcoming and active windows">
        <MaintenanceList
          windows={scheduledOrActive}
          emptyLabel="No maintenance windows scheduled."
        />
      </DetailSidebarCard>

      <DetailSidebarCard title="Past maintenance" subtitle="Completed windows">
        <MaintenanceList windows={pastWindows} emptyLabel="No past maintenance recorded." />
      </DetailSidebarCard>
    </div>
  );
}
