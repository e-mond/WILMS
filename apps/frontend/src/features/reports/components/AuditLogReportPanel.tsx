'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable, KpiCard, Avatar } from '@/components/data-display';
import { ExecutiveKpiGrid, ManagementToolbar } from '@/components/layout/executive';
import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AUDIT_ACTION_FILTER_OPTIONS, AUDIT_ACTION_LABELS } from '@/constants/audit-display';
import { ExportCsvButton } from '@/features/reports/components/ExportCsvButton';
import { WILMS_REPORT_TYPE } from '@/features/export';
import { AuditLogAsidePanel } from '@/features/reports/components/AuditLogAsidePanel';
import { useAuditLogReport } from '@/features/reports/hooks/useAuditLogReport';
import { useShellAsideContent } from '@/hooks/useShellAsideContent';
import { settingsService } from '@/services';
import type { AuditEntry } from '@/types/services';
import { resolveEntityPhotoUrl } from '@/utils/entity-photo';

const CSV_HEADERS = ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'Reason'];

function resolveActorLabel(entry: AuditEntry): string {
  return entry.actorDisplayName ?? entry.actorId;
}

function formatAuditTimestamp(value: string): string {
  return new Date(value).toLocaleString('en-GH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function AuditLogReportPanel() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const usersQuery = useQuery({
    queryKey: ['settings-users-filter'],
    queryFn: () => settingsService.listUsers(),
  });

  const userFilterOptions = useMemo(
    () => [
      { value: '', label: 'All users' },
      ...(usersQuery.data ?? []).map((user) => ({
        value: user.id,
        label: user.displayName,
      })),
    ],
    [usersQuery.data],
  );

  const { data, isLoading, isError } = useAuditLogReport({
    limit: 100,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    actorId: actorFilter || undefined,
    action: actionFilter ? (actionFilter as AuditEntry['action']) : undefined,
  });

  const csvRows = useMemo(
    () =>
      (data ?? []).map((entry) => [
        formatAuditTimestamp(entry.createdAt),
        resolveActorLabel(entry),
        AUDIT_ACTION_LABELS[entry.action],
        entry.targetEntityType,
        entry.targetEntityId,
        entry.reason ?? '—',
      ]),
    [data],
  );

  const entries = data ?? [];

  const asideContent = useMemo(
    () => <AuditLogAsidePanel entriesLoaded={entries.length} />,
    [entries.length],
  );

  useShellAsideContent(asideContent);

  if (isLoading) {
    return <LoadingSpinner label="Loading audit log" className="py-wilms-8" />;
  }

  if (isError) {
    return (
      <EmptyState
        title="Unable to load audit log"
        description="Check your connection and try again."
      />
    );
  }

  return (
    <div className="space-y-wilms-4">
      <ExecutiveKpiGrid>
        <KpiCard variant="executive" label="Entries Loaded" value={entries.length} />
        <KpiCard
          variant="executive"
          label="Log Status"
          value="Immutable"
          valueClassName="text-status-active"
        />
      </ExecutiveKpiGrid>

      <ManagementToolbar
        search={
          <div className="grid gap-wilms-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-wilms-1 text-body">
          <span className="font-medium text-text-primary">From date</span>
          <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
        </label>
        <label className="space-y-wilms-1 text-body">
          <span className="font-medium text-text-primary">To date</span>
          <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
        </label>
        <label className="space-y-wilms-1 text-body">
          <span className="font-medium text-text-primary">User</span>
          <Select
            aria-label="Filter by user"
            value={actorFilter}
            onChange={(event) => setActorFilter(event.target.value)}
          >
            {userFilterOptions.map((option) => (
              <option key={option.value || 'all-users'} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-wilms-1 text-body">
          <span className="font-medium text-text-primary">Action</span>
          <Select
            aria-label="Filter by action"
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value)}
          >
            {AUDIT_ACTION_FILTER_OPTIONS.map((option) => (
              <option key={option.value || 'all-actions'} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </label>
          </div>
        }
        actions={
          <ExportCsvButton
            label="Export"
            filename="audit-log.csv"
            reportType={WILMS_REPORT_TYPE.AUDIT_LOG}
            reportTitle="Audit Log Report"
            headers={CSV_HEADERS}
            rows={csvRows}
            disabled={entries.length === 0}
          />
        }
      />

      {entries.length === 0 ? (
        <EmptyState
          title="No audit entries"
          description="Adjust filters or perform system actions to populate the log."
        />
      ) : (
        <DataTable<AuditEntry>
          variant="executive"
          caption="Audit log entries"
          data={entries}
          getRowId={(entry) => entry.id}
          columns={[
            {
              id: 'createdAt',
              header: 'Timestamp',
              cell: (entry) => formatAuditTimestamp(entry.createdAt),
            },
            {
              id: 'actor',
              header: 'User',
              cell: (entry) => {
                const label = resolveActorLabel(entry);
                return (
                  <div className="flex items-center gap-wilms-2">
                    <Avatar
                      label={label}
                      photoUrl={resolveEntityPhotoUrl({ name: label, id: entry.actorId, photoUrl: entry.actorPhotoUrl })}
                      size="sm"
                    />
                    <span>{label}</span>
                  </div>
                );
              },
            },
            {
              id: 'action',
              header: 'Action',
              cell: (entry) => AUDIT_ACTION_LABELS[entry.action],
            },
            {
              id: 'targetEntityType',
              header: 'Entity',
              cell: (entry) => entry.targetEntityType,
            },
            {
              id: 'targetEntityId',
              header: 'Entity ID',
              cell: (entry) => entry.targetEntityId,
            },
            {
              id: 'reason',
              header: 'Reason',
              cell: (entry) => entry.reason ?? '—',
            },
          ]}
        />
      )}
    </div>
  );
}
