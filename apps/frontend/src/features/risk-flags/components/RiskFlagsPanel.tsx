'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { CurrencyAmount, DataTable, FlagBadge, KpiCard } from '@/components/data-display';
import { RaiseFlagIcon } from '@/components/icons/RaiseFlagIcon';
import { RiskFlagsKpiIcon } from '@/components/icons/RiskFlagsKpiIcon';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { PERMISSION } from '@/constants/permissions';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { ExecutiveKpiGrid, FilterDropdown, FilterDropdownRow, ManagementToolbar } from '@/components/layout/executive';
import {
  buildRiskFlagsExportDocument,
  useWilmsExportActor,
  WilmsExportActions,
} from '@/features/export';
import { FLAG_ENTITY_TYPE_DISPLAY } from '@/constants/entity-type-display';
import { FLAG_STATUS_DISPLAY } from '@/constants/risk-flag-display';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { RiskFlagsAsidePanel } from '@/features/risk-flags/components/RiskFlagsAsidePanel';
import { RaiseFlagModal } from '@/features/risk-flags/components/RaiseFlagModal';
import { useRiskFlagActions } from '@/features/risk-flags/hooks/useRiskFlagActions';
import { useRiskFlagDetail } from '@/features/risk-flags/hooks/useRiskFlagDetail';
import { useRiskFlags } from '@/features/risk-flags/hooks/useRiskFlags';
import { usePaginatedRows } from '@/hooks/usePaginatedRows';
import { useQueryLoadingPolicy } from '@/hooks/useQueryLoadingPolicy';
import { useShellAsideContent } from '@/hooks/useShellAsideContent';
import { buildDefaultFlagTimeline } from '@/utils/risk-flag-list';
import { FLAG_STATUS, FLAG_TYPE, type RiskFlagSummary } from '@/types/risk-flag';
import { formatDisplayDate } from '@/utils/format-date';
import { resolveEntityDisplayId } from '@/utils/entity-display-id';
import { EMPTY_STATE_COPY } from '@/constants/empty-state-copy';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: FLAG_STATUS.OPEN, label: 'Open' },
  { value: FLAG_STATUS.UNDER_REVIEW, label: 'Under Review' },
  { value: FLAG_STATUS.CRITICAL, label: 'Critical' },
  { value: FLAG_TYPE.BLACKLISTED, label: 'Blacklisted' },
];

type SortKey = 'id' | 'entityName' | 'raisedAt' | 'arrearsPesewas' | 'status';
type SortDirection = 'asc' | 'desc';

function SortableHeader({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-wilms-1 uppercase tracking-wide"
      onClick={onClick}
    >
      {label}
      {active ? <span aria-hidden="true">{direction === 'asc' ? '↑' : '↓'}</span> : null}
    </button>
  );
}

function sortFlags(flags: RiskFlagSummary[], sortKey: SortKey, direction: SortDirection) {
  const multiplier = direction === 'asc' ? 1 : -1;

  return [...flags].sort((left, right) => {
    switch (sortKey) {
      case 'id':
        return left.id.localeCompare(right.id) * multiplier;
      case 'entityName':
        return left.entityName.localeCompare(right.entityName) * multiplier;
      case 'raisedAt':
        return left.raisedAt.localeCompare(right.raisedAt) * multiplier;
      case 'arrearsPesewas':
        return (left.arrearsPesewas - right.arrearsPesewas) * multiplier;
      case 'status':
        return left.status.localeCompare(right.status) * multiplier;
      default:
        return 0;
    }
  });
}

export function RiskFlagsPanel() {
  const generatedBy = useWilmsExportActor();
  const { escalateToBlacklist, markResolved, assignOfficer, raiseFlag } = useRiskFlagActions();
  const { data, isLoading, isError, error, refetch } = useRiskFlags();
  const { showLoading, isTimedOut, isForbidden } = useQueryLoadingPolicy({ isLoading, isError, error });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('raisedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [raiseFlagOpen, setRaiseFlagOpen] = useState(false);
  const [isRaisingFlag, setIsRaisingFlag] = useState(false);

  const filteredFlags = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return (data?.flags ?? []).filter((flag) => {
      const matchesSearch =
        !query ||
        flag.entityName.toLowerCase().includes(query) ||
        flag.id.toLowerCase().includes(query) ||
        flag.community.toLowerCase().includes(query) ||
        flag.entityId.toLowerCase().includes(query);
      const matchesStatus =
        !statusFilter ||
        (statusFilter === FLAG_TYPE.BLACKLISTED
          ? flag.flagType === FLAG_TYPE.BLACKLISTED
          : flag.status === statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [data?.flags, searchQuery, statusFilter]);

  const sortedFlags = useMemo(
    () => sortFlags(filteredFlags, sortKey, sortDirection),
    [filteredFlags, sortDirection, sortKey],
  );

  const { page, pageCount, setPage, slice, total } = usePaginatedRows(sortedFlags, 8);

  const selected =
    sortedFlags.find((flag) => flag.id === selectedId) ?? slice[0] ?? null;

  const { data: flagDetail } = useRiskFlagDetail(selected?.id);
  const timeline = useMemo(
    () => flagDetail?.timeline ?? (selected ? buildDefaultFlagTimeline(selected) : []),
    [flagDetail?.timeline, selected],
  );

  const exportDocument = useMemo(
    () =>
      data
        ? buildRiskFlagsExportDocument({
            data,
            flags: sortedFlags,
            generatedBy,
            selectedFlag: selected,
            timeline,
          })
        : null,
    [data, generatedBy, selected, sortedFlags, timeline],
  );

  const asideContent = useMemo(() => {
    if (!data || !selected) {
      return data ? (
        <RiskFlagsAsidePanel
          data={data}
          selected={null}
          timeline={[]}
          onEscalate={() => undefined}
          onResolve={() => undefined}
          onAssign={() => undefined}
        />
      ) : null;
    }

    return (
      <RiskFlagsAsidePanel
        data={data}
        selected={selected}
        timeline={timeline}
        onEscalate={() => void escalateToBlacklist(selected)}
        onResolve={() => void markResolved(selected)}
        onAssign={() => void assignOfficer(selected)}
      />
    );
  }, [assignOfficer, data, escalateToBlacklist, markResolved, selected, timeline]);

  useShellAsideContent(asideContent);

  function toggleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(nextKey);
    setSortDirection('desc');
  }

  if (isLoading) {
    return (
      <QueryStatePanel isLoading showLoading={showLoading} isTimedOut={isTimedOut} isError={false} variant="table">
        {null}
      </QueryStatePanel>
    );
  }

  if (isError) {
    return (
      <QueryStatePanel
        isLoading={false}
        isError
        error={error}
      isForbidden={isForbidden}
        onRetry={() => void refetch()}
        variant="table"
      >
        {null}
      </QueryStatePanel>
    );
  }

  if (!data) {
    return (
      <QueryStatePanel
        isLoading={false}
        isError={false}
        isEmpty
        emptyTitle={EMPTY_STATE_COPY.riskFlags.title}
        emptyDescription={EMPTY_STATE_COPY.riskFlags.description}
        variant="table"
      >
        {null}
      </QueryStatePanel>
    );
  }

  const sortHeader = (label: string, key: SortKey): ReactNode => (
    <SortableHeader
      label={label}
      active={sortKey === key}
      direction={sortDirection}
      onClick={() => toggleSort(key)}
    />
  );

  return (
    <div className="space-y-wilms-4">
      <ExecutiveKpiGrid>
        <KpiCard
          variant="executive"
          label="Open Flags"
          value={data.summary.openFlags}
          valueClassName="text-danger"
          className="border-danger/20"
          icon={<RiskFlagsKpiIcon name="open-flags" className="text-danger" />}
        />
        <KpiCard
          variant="executive"
          label="Blacklisted"
          value={data.summary.blacklisted}
          valueClassName="text-danger"
          className="border-danger/20"
          icon={<RiskFlagsKpiIcon name="blacklisted" className="text-danger" />}
        />
        <KpiCard
          variant="executive"
          label="Outstanding Arrears"
          value={<CurrencyAmount value={data.summary.outstandingArrearsPesewas} />}
          valueClassName="text-executive-gold"
          className="border-executive-gold/30"
          icon={<RiskFlagsKpiIcon name="arrears" className="text-executive-gold" />}
        />
        <KpiCard
          variant="executive"
          label="High-Risk Borrowers"
          value={data.summary.highRiskBorrowers}
          valueClassName="text-executive-gold"
          className="border-executive-gold/30"
          icon={<RiskFlagsKpiIcon name="high-risk" className="text-executive-gold" />}
        />
      </ExecutiveKpiGrid>

      <ManagementToolbar
        search={
          <Input
            aria-label="Search flags"
            placeholder="Search flags, borrowers, groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        }
        filters={
          <FilterDropdownRow>
            <FilterDropdown
              label="Status"
              ariaLabel="Filter risk flags"
              options={STATUS_FILTERS}
              value={statusFilter}
              onChange={setStatusFilter}
            />
          </FilterDropdownRow>
        }
        actions={
          <>
            {exportDocument ? (
              <WilmsExportActions
                document={exportDocument}
                filenameBase="risk-flags"
                showIcons
                className="[&>button:first-child]:gap-wilms-2"
              />
            ) : null}
            <PermissionGate permission={PERMISSION.REVIEW_RISK_FLAGS}>
              <Button
                variant="danger"
                size="sm"
                className="gap-wilms-2"
                onClick={() => setRaiseFlagOpen(true)}
              >
                <RaiseFlagIcon />
                Raise Flag
              </Button>
            </PermissionGate>
          </>
        }
      />

      <DataTable<RiskFlagSummary>
        variant="executive"
        caption="Risk flags"
        data={slice}
        getRowId={(row) => row.id}
        selectedRowId={selected?.id}
        onRowClick={(row) => setSelectedId(row.id)}
        columns={[
          {
            id: 'id',
            header: sortHeader('Flag ID', 'id'),
            cell: (row) => <span className="font-semibold text-executive-gold">{row.id}</span>,
          },
          {
            id: 'entity',
            header: sortHeader('Entity', 'entityName'),
            cell: (row) => (
              <div className="text-left">
                <p className="font-semibold text-text-primary">{row.entityName}</p>
                <p className="text-small text-text-muted">{resolveEntityDisplayId(row)}</p>
              </div>
            ),
          },
          {
            id: 'entityType',
            header: 'Type',
            cell: (row) => FLAG_ENTITY_TYPE_DISPLAY[row.entityType],
          },
          {
            id: 'flagType',
            header: 'Flag Type',
            cell: (row) => <FlagBadge flagType={row.flagType} />,
          },
          { id: 'community', header: 'Community', cell: (row) => row.community },
          { id: 'officer', header: 'Officer', cell: (row) => row.officerName },
          {
            id: 'raised',
            header: sortHeader('Raised', 'raisedAt'),
            cell: (row) => formatDisplayDate(row.raisedAt),
          },
          {
            id: 'arrears',
            header: sortHeader('Arrears', 'arrearsPesewas'),
            cell: (row) => <CurrencyAmount value={row.arrearsPesewas} className="text-danger" />,
          },
          {
            id: 'status',
            header: sortHeader('Priority / Status', 'status'),
            cell: (row) => (
              <Badge variant={FLAG_STATUS_DISPLAY[row.status].variant}>
                {FLAG_STATUS_DISPLAY[row.status].label}
              </Badge>
            ),
          },
        ]}
      />

      <div className="flex flex-col gap-wilms-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="text-small text-text-muted">
          Showing {slice.length} of {total} flags
        </p>
        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} ariaLabel="Risk flags pagination" />
      </div>

      <RaiseFlagModal
        isOpen={raiseFlagOpen}
        isSubmitting={isRaisingFlag}
        onClose={() => setRaiseFlagOpen(false)}
        onSubmit={async (values) => {
          setIsRaisingFlag(true);
          try {
            await raiseFlag(values);
            setRaiseFlagOpen(false);
          } finally {
            setIsRaisingFlag(false);
          }
        }}
      />
    </div>
  );
}
