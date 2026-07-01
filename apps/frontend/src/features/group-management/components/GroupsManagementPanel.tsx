'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { CurrencyAmount, DataTable, GroupRiskBadge, KpiCard } from '@/components/data-display';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import {
  ExecutiveKpiGrid,
  FilterPillBar,
  ManagementToolbar,
} from '@/components/layout/executive';
import { GroupsKpiIcon } from '@/components/icons/GroupsKpiIcon';
import { ExportCsvButton } from '@/features/reports/components/ExportCsvButton';
import { WILMS_REPORT_TYPE } from '@/features/export';
import { GroupsAsidePanel } from '@/features/group-management/components/GroupsAsidePanel';
import { GROUPS_REFERENCE_PAGE_SIZE } from '@/constants/groups-reference-scale';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { useGroups } from '@/features/group-management/hooks/useGroups';
import { useCreateGroup } from '@/features/group-management/hooks/useCreateGroup';
import { usePaginatedRows } from '@/hooks/usePaginatedRows';
import { useShellAsideContent } from '@/hooks/useShellAsideContent';
import { GROUP_RISK_LEVEL, type GroupSummary } from '@/types/group';
import { collectorRateTextClass } from '@/utils/collector-rate-display';
import { formatDisplayDate } from '@/utils/format-date';
import { resolveGroupDisplayId } from '@/utils/entity-display-id';
import { formatPesewasForCsv } from '@/utils/export-csv';

const RISK_FILTERS = [
  { value: '', label: 'All' },
  { value: GROUP_RISK_LEVEL.LOW_RISK, label: 'Low Risk' },
  { value: GROUP_RISK_LEVEL.AT_RISK, label: 'At Risk' },
  { value: GROUP_RISK_LEVEL.FLAGGED, label: 'Flagged' },
  { value: GROUP_RISK_LEVEL.SUSPENDED, label: 'Suspended' },
];

export function GroupsManagementPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const riskFromUrl = searchParams.get('risk') ?? '';
  const { data, isLoading, isError, refetch } = useGroups();
  const createGroup = useCreateGroup();
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState(riskFromUrl);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCommunity, setNewGroupCommunity] = useState('');

  useEffect(() => {
    setRiskFilter(riskFromUrl);
  }, [riskFromUrl]);

  function handleRiskFilterChange(nextRisk: string) {
    setRiskFilter(nextRisk);

    const params = new URLSearchParams(searchParams.toString());

    if (nextRisk) {
      params.set('risk', nextRisk);
    } else {
      params.delete('risk');
    }

    const query = params.toString();
    router.replace(query ? `/groups?${query}` : '/groups', { scroll: false });
  }

  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return (data?.groups ?? []).filter((group) => {
      const matchesSearch =
        !query ||
        group.name.toLowerCase().includes(query) ||
        resolveGroupDisplayId(group).toLowerCase().includes(query) ||
        group.id.toLowerCase().includes(query) ||
        group.community.toLowerCase().includes(query);
      const matchesRisk = !riskFilter || group.riskLevel === riskFilter;

      return matchesSearch && matchesRisk;
    });
  }, [data?.groups, searchQuery, riskFilter]);

  const { page, pageCount, setPage, slice, total } = usePaginatedRows(
    filteredGroups,
    GROUPS_REFERENCE_PAGE_SIZE,
  );

  const selected =
    filteredGroups.find((group) => group.id === selectedId) ?? slice[0] ?? null;

  const asideContent = useMemo(() => {
    if (!data) {
      return null;
    }

    return <GroupsAsidePanel data={data} selected={selected} />;
  }, [data, selected]);

  useShellAsideContent(asideContent);

  const csvRows = filteredGroups.map((group) => [
    group.id,
    group.name,
    group.community,
    group.officerName,
    String(group.memberCount),
    String(group.activeMemberCount),
    formatPesewasForCsv(group.disbursedPesewas),
    formatPesewasForCsv(group.collectedPesewas),
    String(group.collectionRatePercent),
    group.riskLevel,
  ]);

  return (
    <>
    <QueryStatePanel
      isLoading={isLoading}
      isError={isError || !data}
      errorMessage="Unable to load groups. Try again shortly."
      onRetry={() => void refetch()}
      variant="table"
    >
      {data ? (
    <div className="space-y-wilms-4">
      <ExecutiveKpiGrid>
        <KpiCard
          variant="executive"
          label="Active Groups"
          value={data.summary.activeGroups}
          valueClassName="text-brand-primary"
          icon={<GroupsKpiIcon name="active-groups" />}
        />
        <KpiCard
          variant="executive"
          label="Total Members"
          value={data.summary.totalMembers.toLocaleString()}
          valueClassName="text-brand-primary"
          icon={<GroupsKpiIcon name="total-members" />}
        />
        <KpiCard
          variant="executive"
          label="Flagged / Suspended"
          value={data.summary.flaggedOrSuspended}
          valueClassName="text-danger"
          icon={<GroupsKpiIcon name="flagged-suspended" />}
        />
        <KpiCard
          variant="executive"
          label="Avg Collection Rate"
          value={`${data.summary.avgCollectionRatePercent}%`}
          valueClassName="text-status-active"
          trendDirection="up"
          icon={<GroupsKpiIcon name="avg-rate" />}
        />
      </ExecutiveKpiGrid>

      <ManagementToolbar
        search={
          <Input
            aria-label="Search groups"
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        }
        filters={
          <FilterPillBar
            ariaLabel="Filter groups by risk level"
            options={RISK_FILTERS}
            value={riskFilter}
            onChange={handleRiskFilterChange}
          />
        }
        actions={
          <>
            <ExportCsvButton
              label="Export"
              showDownloadIcon
              filename="groups.csv"
              reportType={WILMS_REPORT_TYPE.GROUP_LIST}
              reportTitle="Groups Management Export"
              headers={[
                'Group ID',
                'Group Name',
                'Community',
                'Registration Officer',
                'Total Members',
                'Active Members',
                'Disbursed (GHS)',
                'Collected (GHS)',
                'Collection Rate',
                'Risk Level',
              ]}
              rows={csvRows}
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setCreateModalOpen(true)}
            >
              + New Group
            </Button>
          </>
        }
      />
      <DataTable<GroupSummary>
        variant="executive"
        caption="Groups"
        data={slice}
        getRowId={(row) => row.id}
        selectedRowId={selected?.id}
        onRowClick={(row) => setSelectedId(row.id)}
        columns={[
          {
            id: 'groupId',
            header: 'Group ID',
            cell: (row) => (
              <Link
                href={`/groups/${row.id}`}
                className="font-semibold text-executive-gold hover:underline"
                onClick={(event) => event.stopPropagation()}
              >
                {resolveGroupDisplayId(row)}
              </Link>
            ),
          },
          {
            id: 'group',
            header: 'Name',
            cell: (row) => (
              <Link
                href={`/groups/${row.id}`}
                className="text-left hover:underline"
                onClick={(event) => event.stopPropagation()}
              >
                <p className="font-semibold text-text-primary">{row.name}</p>
                <p className="text-small text-text-muted">
                  Formed {formatDisplayDate(row.formedAt)}
                </p>
              </Link>
            ),
          },
          { id: 'community', header: 'Community', cell: (row) => row.community },
          { id: 'officer', header: 'Officer', cell: (row) => row.officerName },
          {
            id: 'members',
            header: 'Members',
            cell: (row) => (
              <div>
                <p className="font-semibold">{row.memberCount}</p>
                <p className="text-small text-text-muted">{row.activeMemberCount} active</p>
              </div>
            ),
          },
          {
            id: 'disbursed',
            header: 'Disbursed',
            cell: (row) => <CurrencyAmount value={row.disbursedPesewas} />,
          },
          {
            id: 'collected',
            header: 'Collected',
            cell: (row) => (
              <CurrencyAmount value={row.collectedPesewas} className="text-status-active" />
            ),
          },
          {
            id: 'rate',
            header: 'Rate',
            cell: (row) => (
              <span className={`font-semibold ${collectorRateTextClass(row.collectionRatePercent)}`}>
                {row.collectionRatePercent}%
              </span>
            ),
          },
          { id: 'risk', header: 'Risk', cell: (row) => <GroupRiskBadge riskLevel={row.riskLevel} /> },
        ]}
      />
      <div className="flex flex-wrap items-center justify-between gap-wilms-3">
        <p className="text-small text-text-muted">
          Showing {slice.length} of {total} groups
        </p>
        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} ariaLabel="Groups pagination" />
      </div>
    </div>
      ) : null}
    </QueryStatePanel>

      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Group"
        footer={
          <>
            <Button type="button" variant="secondary" size="sm" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={
                createGroup.isPending || !newGroupName.trim() || !newGroupCommunity.trim()
              }
              onClick={() => {
                void createGroup
                  .mutateAsync({
                    name: newGroupName.trim(),
                    community: newGroupCommunity.trim(),
                  })
                  .then(() => {
                    setCreateModalOpen(false);
                    setNewGroupName('');
                    setNewGroupCommunity('');
                  });
              }}
            >
              {createGroup.isPending ? 'Creating…' : 'Create Group'}
            </Button>
          </>
        }
      >
        <div className="space-y-wilms-4">
          <div>
            <label htmlFor="new-group-name" className="text-small font-semibold text-text-primary">
              Group name
            </label>
            <Input
              id="new-group-name"
              className="mt-wilms-2"
              value={newGroupName}
              onChange={(event) => setNewGroupName(event.target.value)}
              placeholder="Sunrise Women"
            />
          </div>
          <div>
            <label htmlFor="new-group-community" className="text-small font-semibold text-text-primary">
              Community
            </label>
            <Input
              id="new-group-community"
              className="mt-wilms-2"
              value={newGroupCommunity}
              onChange={(event) => setNewGroupCommunity(event.target.value)}
              placeholder="Madina"
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
