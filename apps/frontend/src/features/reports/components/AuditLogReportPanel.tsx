'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable, KpiCard, Avatar } from '@/components/data-display';
import {
  ExecutiveKpiGrid,
  FilterDropdown,
  FilterDropdownRow,
  ManagementToolbar,
} from '@/components/layout/executive';
import { GuidedEmptyState } from '@/components/feedback/GuidedEmptyState';
import { QueryErrorState } from '@/components/feedback/QueryErrorState';
import { AuditLogTableSkeleton } from '@/components/feedback/AuditLogTableSkeleton';
import { EMPTY_STATE_COPY } from '@/constants/empty-state-copy';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AUDIT_ACTION_FILTER_OPTIONS, AUDIT_ACTION_LABELS } from '@/constants/audit-display';
import { ExportCsvButton } from '@/features/reports/components/ExportCsvButton';
import { WILMS_REPORT_TYPE } from '@/features/export';
import { PERMISSION } from '@/constants/permissions';
import { usePermission } from '@/hooks/usePermissions';
import { AuditLogAsidePanel } from '@/features/reports/components/AuditLogAsidePanel';
import { useAuditLogReport } from '@/features/reports/hooks/useAuditLogReport';
import { useShellAsideContent } from '@/hooks/useShellAsideContent';
import { settingsService } from '@/services';
import type { AuditEntry } from '@/types/services';
import { resolveEntityDisplayId, resolveUserDisplayId, resolveAdjustmentDisplayId } from '@/utils/entity-display-id';
import { groupAuditEntriesByPeriod } from '@/utils/audit-log-groups';
import { resolveEntityPhotoUrl } from '@/utils/entity-photo';
import { formatDisplayDate } from '@/utils/format-date';
import { resolveAuditReason } from '@/utils/audit-reason-display';
import { cn } from '@/utils/cn';
import { ChevronDown, ShieldCheck } from 'lucide-react';

const CSV_HEADERS = ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'Reason'];

function resolveActorLabel(entry: AuditEntry): string {
  return entry.actorDisplayName ?? entry.actorDisplayId ?? resolveUserDisplayId(entry.actorId);
}

function resolveActorSubLabel(entry: AuditEntry): string | null {
  const label = resolveActorLabel(entry);
  const displayId = entry.actorDisplayId ?? resolveUserDisplayId(entry.actorId);

  if (displayId && displayId !== label) {
    return displayId;
  }

  return null;
}

function resolveTargetEntityLabel(entry: AuditEntry): string {
  if (entry.targetEntityDisplayId) {
    return entry.targetEntityDisplayId;
  }

  if (entry.targetEntityType === 'ADJUSTMENT') {
    return resolveAdjustmentDisplayId({
      id: entry.targetEntityId,
      requestedAt: entry.createdAt,
    });
  }

  return resolveEntityDisplayId({
    entityId: entry.targetEntityId,
    entityType: entry.targetEntityType,
  });
}

function formatAuditTimestamp(value: string): { date: string; time: string } {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return { date: value, time: '' };
  }

  return {
    date: formatDisplayDate(value),
    time: parsed.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

function AuditActionBadge({ action }: { action: AuditEntry['action'] }) {
  const label =
    AUDIT_ACTION_LABELS[action] ?? action.replaceAll('_', ' ').toLowerCase();

  return (
    <span className="inline-flex max-w-full rounded-full border border-border/80 bg-background px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-text-primary">
      {label}
    </span>
  );
}

export function AuditLogReportPanel() {
  const canListUsers = usePermission(PERMISSION.VIEW_ALL_USERS);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const pageSize = 25;

  const usersQuery = useQuery({
    queryKey: ['settings-users-filter'],
    queryFn: () => settingsService.listUsers(),
    enabled: canListUsers,
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

  const { data, isLoading, isError, error, refetch } = useAuditLogReport({
    limit: 100,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    actorId: actorFilter || undefined,
    action: actionFilter ? (actionFilter as AuditEntry['action']) : undefined,
  });

  const csvRows = useMemo(
    () =>
      (data ?? []).map((entry) => {
        const timestamp = formatAuditTimestamp(entry.createdAt);
        return [
          timestamp.time ? `${timestamp.date} ${timestamp.time}` : timestamp.date,
          resolveActorLabel(entry),
          AUDIT_ACTION_LABELS[entry.action],
          entry.targetEntityType,
          resolveTargetEntityLabel(entry),
          resolveAuditReason(entry.reason),
        ];
      }),
    [data],
  );

  const entries = useMemo(() => data ?? [], [data]);

  const filteredEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return entries;
    }

    return entries.filter((entry) => {
      const haystack = [
        resolveActorLabel(entry),
        entry.action,
        entry.targetEntityType,
        resolveTargetEntityLabel(entry),
        resolveAuditReason(entry.reason),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [entries, searchQuery]);

  const pagedEntries = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredEntries.slice(start, start + pageSize);
  }, [filteredEntries, page]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / pageSize));

  const groupedEntries = useMemo(
    () =>
      groupAuditEntriesByPeriod(
        pagedEntries.map((entry) => ({ ...entry, timestamp: entry.createdAt })),
      ),
    [pagedEntries],
  );

  const asideContent = useMemo(
    () => <AuditLogAsidePanel entriesLoaded={entries.length} />,
    [entries.length],
  );

  useShellAsideContent(asideContent);

  if (isLoading) {
    return <AuditLogTableSkeleton />;
  }

  if (isError) {
    return (
      <QueryErrorState
        error={error}
        onRetry={() => void refetch()}
        title="Unable to load audit log"
      />
    );
  }

  return (
    <div className="space-y-wilms-5">
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card">
        <div className="bg-gradient-to-br from-brand-primary/[0.08] via-transparent to-slate-500/[0.04] px-wilms-5 py-wilms-5 sm:px-wilms-6">
          <div className="flex flex-col gap-wilms-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-small font-semibold uppercase tracking-wide text-brand-primary">
                Compliance
              </p>
              <h1 className="mt-wilms-1 text-heading-1 font-semibold text-text-primary">Audit log</h1>
              <p className="mt-wilms-1 max-w-2xl text-small text-text-muted">
                Immutable trail of sensitive platform actions. Filter by date, actor, or action type.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card/80 px-3 py-2 text-small text-text-muted">
              <ShieldCheck className="h-4 w-4 text-brand-primary" aria-hidden="true" />
              Append-only history
            </div>
          </div>
        </div>
      </div>

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
          <Input
            aria-label="Search audit log"
            placeholder="Search user, action, entity, or reason"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setPage(1);
            }}
          />
        }
        filters={
          <FilterDropdownRow className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <label className="flex min-w-0 w-full flex-col gap-wilms-1">
              <span className="text-small font-semibold text-text-muted">From date</span>
              <Input
                type="date"
                aria-label="Filter from date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="min-h-[44px] w-full"
              />
            </label>
            <label className="flex min-w-0 w-full flex-col gap-wilms-1">
              <span className="text-small font-semibold text-text-muted">To date</span>
              <Input
                type="date"
                aria-label="Filter to date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="min-h-[44px] w-full"
              />
            </label>
            <FilterDropdown
              label="User"
              ariaLabel="Filter by user"
              options={userFilterOptions}
              value={actorFilter}
              onChange={setActorFilter}
            />
            <FilterDropdown
              label="Action"
              ariaLabel="Filter by action"
              options={AUDIT_ACTION_FILTER_OPTIONS}
              value={actionFilter}
              onChange={setActionFilter}
            />
          </FilterDropdownRow>
        }
        actions={
          <ExportCsvButton
            label="Export"
            filename="WILMS_Audit_Log.csv"
            reportType={WILMS_REPORT_TYPE.AUDIT_LOG}
            reportTitle="Audit Log Report"
            headers={CSV_HEADERS}
            rows={csvRows}
            disabled={entries.length === 0}
          />
        }
      />

      {filteredEntries.length === 0 ? (
        <GuidedEmptyState
          {...EMPTY_STATE_COPY.reports}
          title="No audit entries"
          description="Adjust filters or perform system actions to populate the log."
        />
      ) : (
        <div className="space-y-wilms-6">
          {groupedEntries.map((group) => {
            const collapsed = collapsedGroups[group.key] ?? false;
            return (
              <section key={group.key} className="overflow-hidden rounded-2xl border border-border/80 bg-card">
                <button
                  type="button"
                  className="flex w-full min-h-[44px] items-center justify-between gap-wilms-3 px-wilms-4 py-wilms-3.5 text-left transition-colors hover:bg-background/70"
                  aria-expanded={!collapsed}
                  onClick={() =>
                    setCollapsedGroups((current) => ({
                      ...current,
                      [group.key]: !collapsed,
                    }))
                  }
                >
                  <span className="min-w-0 break-words text-heading-3 font-semibold text-text-primary">
                    {group.label}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-2 text-small text-text-muted">
                    {group.entries.length} entries
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform',
                        !collapsed && 'rotate-180',
                      )}
                      aria-hidden="true"
                    />
                  </span>
                </button>
                {!collapsed ? (
                  <div className="min-w-0 border-t border-border/70 p-wilms-2 sm:p-wilms-3">
                    <DataTable<AuditEntry>
                      variant="executive"
                      layout="auto"
                      mobileLayout="stack"
                      caption={`${group.label} audit entries`}
                      data={group.entries}
                      getRowId={(entry) => entry.id}
                      columns={[
            {
              id: 'createdAt',
              header: 'Date & Time',
              className: 'w-[12%] whitespace-nowrap',
              cell: (entry) => {
                const timestamp = formatAuditTimestamp(entry.createdAt);
                return (
                  <div className="space-y-0.5">
                    <p className="font-semibold text-text-primary">{timestamp.date}</p>
                    {timestamp.time ? (
                      <p className="text-small text-text-muted">{timestamp.time}</p>
                    ) : null}
                  </div>
                );
              },
            },
            {
              id: 'actor',
              header: 'User',
              className: 'w-[18%] min-w-[10rem]',
              cell: (entry) => {
                const label = resolveActorLabel(entry);
                const subLabel = resolveActorSubLabel(entry);
                return (
                  <div className="flex items-center gap-wilms-2">
                    <Avatar
                      label={label}
                      photoUrl={resolveEntityPhotoUrl({
                        name: label,
                        id: entry.actorId,
                        photoUrl: entry.actorPhotoUrl,
                      })}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-text-primary">{label}</p>
                      {subLabel ? (
                        <p className="truncate text-small text-text-muted">{subLabel}</p>
                      ) : null}
                    </div>
                  </div>
                );
              },
            },
            {
              id: 'action',
              header: 'Action',
              className: 'w-[16%] min-w-[8rem]',
              cell: (entry) => <AuditActionBadge action={entry.action} />,
            },
            {
              id: 'targetEntityType',
              header: 'Entity',
              className: 'w-[10%] min-w-[6rem]',
              cell: (entry) => (
                <span className="text-small font-semibold uppercase tracking-wide text-text-muted">
                  {entry.targetEntityType}
                </span>
              ),
            },
            {
              id: 'targetEntityId',
              header: 'Entity ID',
              className: 'w-[16%] min-w-[8rem]',
              cell: (entry) => (
                <span className="font-mono text-small text-text-primary">
                  {resolveTargetEntityLabel(entry)}
                </span>
              ),
            },
            {
              id: 'reason',
              header: 'Reason',
              className: cn('w-[22%] min-w-[10rem]'),
              cell: (entry) => (
                <span className="text-small text-text-muted">{resolveAuditReason(entry.reason)}</span>
              ),
            },
          ]}
                    />
                  </div>
                ) : null}
              </section>
            );
          })}

          <div className="flex flex-col gap-wilms-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-small text-text-muted">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredEntries.length)} of{' '}
              {filteredEntries.length}
            </p>
            <div className="flex items-center gap-wilms-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <span className="text-small text-text-muted">
                Page {page} of {totalPages}
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
