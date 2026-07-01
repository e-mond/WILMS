'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  CurrencyAmount,
  DataTable,
  KpiCard,
  Sparkline,
} from '@/components/data-display';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import {
  ExecutiveKpiGrid,
  FilterPillBar,
  ManagementToolbar,
} from '@/components/layout/executive';
import { CollectorsKpiIcon } from '@/components/icons/CollectorsKpiIcon';
import { CollectorStreakIcon } from '@/components/icons/CollectorStreakIcon';
import { ExportCsvButton } from '@/features/reports/components/ExportCsvButton';
import { WILMS_REPORT_TYPE } from '@/features/export';
import { CollectorsAsidePanel } from '@/features/collector-management/components/CollectorsAsidePanel';
import { CollectorsMobileCardList } from '@/features/collector-management/components/CollectorsMobileCardList';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { Pagination } from '@/components/ui/Pagination';
import { useCollectorsManagement } from '@/features/collector-management/hooks/useCollectorsManagement';
import { useOnboardCollector } from '@/features/collector-management/hooks/useOnboardCollector';
import {
  useMessageCollector,
  useMessageThread,
} from '@/features/collector-management/hooks/useMessageCollector';
import { usePaginatedRows } from '@/hooks/usePaginatedRows';
import { useShellAsideContent } from '@/hooks/useShellAsideContent';
import { COLLECTOR_STATUS, type CollectorSummary } from '@/types/collector-management';
import { collectorRateTextClass } from '@/utils/collector-rate-display';
import { resolveEntityPhotoUrl } from '@/utils/entity-photo';
import { formatPesewasForCsv } from '@/utils/export-csv';
import { resolveCollectorDisplayId } from '@/utils/entity-display-id';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: COLLECTOR_STATUS.ACTIVE, label: 'Active' },
  { value: COLLECTOR_STATUS.AWAY, label: 'Away' },
  { value: 'top', label: '≥ 90%' },
  { value: 'on-track', label: '70–89%' },
  { value: 'needs-attention', label: '< 70%' },
];

function matchesCollectorFilter(collector: CollectorSummary, filter: string): boolean {
  if (!filter) {
    return true;
  }

  if (filter === COLLECTOR_STATUS.ACTIVE || filter === COLLECTOR_STATUS.AWAY) {
    return collector.status === filter;
  }

  if (filter === 'top') {
    return collector.collectionRatePercent >= 90;
  }

  if (filter === 'on-track') {
    return collector.collectionRatePercent >= 70 && collector.collectionRatePercent < 90;
  }

  if (filter === 'needs-attention') {
    return collector.collectionRatePercent < 70;
  }

  return true;
}

export function CollectorsManagementPanel() {
  const { data, isLoading, isError, refetch } = useCollectorsManagement();
  const onboardCollector = useOnboardCollector();
  const { createThread, sendMessage } = useMessageCollector();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [onboardModalOpen, setOnboardModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [zone, setZone] = useState('');
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageCollector, setMessageCollector] = useState<CollectorSummary | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messageBody, setMessageBody] = useState('');
  const { data: thread } = useMessageThread(threadId);

  const filteredCollectors = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return (data?.collectors ?? []).filter((collector) => {
      const matchesSearch =
        !query ||
        collector.displayName.toLowerCase().includes(query) ||
        collector.zone.toLowerCase().includes(query) ||
        collector.displayId?.toLowerCase().includes(query) ||
        collector.id.toLowerCase().includes(query);
      const matchesStatus = matchesCollectorFilter(collector, statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [data?.collectors, searchQuery, statusFilter]);

  const { page, pageCount, setPage, slice, total } = usePaginatedRows(filteredCollectors);

  const selected =
    filteredCollectors.find((collector) => collector.id === selectedId) ??
    slice[0] ??
    null;

  useEffect(() => {
    if (!messageModalOpen || !messageCollector) {
      return;
    }

    void createThread.mutateAsync(messageCollector.id).then((createdThread) => {
      setThreadId(createdThread.id);
    });
  }, [messageCollector, messageModalOpen, createThread]);

  function openMessageModal(collector: CollectorSummary) {
    setMessageCollector(collector);
    setThreadId(null);
    setMessageBody('');
    setMessageModalOpen(true);
  }

  function closeMessageModal() {
    setMessageModalOpen(false);
    setMessageCollector(null);
    setThreadId(null);
    setMessageBody('');
  }

  const asideContent = useMemo(() => {
    if (!data) {
      return null;
    }

    return (
      <CollectorsAsidePanel
        data={data}
        selected={selected}
        onMessage={() => {
          if (selected) {
            openMessageModal(selected);
          }
        }}
      />
    );
  }, [data, selected]);

  useShellAsideContent(asideContent);

  const csvRows = filteredCollectors.map((collector) => [
    collector.id,
    collector.displayName,
    collector.zone,
    String(collector.groupCount),
    String(collector.borrowerCount),
    formatPesewasForCsv(collector.expectedPesewas),
    formatPesewasForCsv(collector.collectedPesewas),
    String(collector.collectionRatePercent),
    collector.status,
  ]);

  return (
    <>
      <QueryStatePanel
        isLoading={isLoading}
        isError={isError || !data}
        errorMessage="Unable to load collectors. Try again shortly."
        onRetry={() => void refetch()}
        variant="table"
      >
        {data ? (
          <div className="space-y-wilms-4">
            <ExecutiveKpiGrid>
              <KpiCard
                variant="executive"
                label="Total Collectors"
                value={data.summary.totalCollectors}
                icon={<CollectorsKpiIcon name="total-collectors" />}
              />
              <KpiCard
                variant="executive"
                label="Avg Collection Rate"
                value={`${data.summary.avgCollectionRatePercent}%`}
                valueClassName="text-status-active"
                trendDirection="up"
                icon={<CollectorsKpiIcon name="avg-rate" />}
              />
              <KpiCard
                variant="executive"
                label="Below 70% Rate"
                value={data.summary.belowSeventyPercent}
                valueClassName="text-danger"
                trendDirection="down"
                icon={<CollectorsKpiIcon name="below-seventy" />}
              />
              <KpiCard
                variant="executive"
                label="Active Today"
                value={data.summary.activeToday}
                valueClassName="text-brand-primary"
                icon={<CollectorsKpiIcon name="active-today" />}
              />
            </ExecutiveKpiGrid>

            <ManagementToolbar
              search={
                <Input
                  aria-label="Search collectors"
                  placeholder="Search collectors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              }
              filters={
                <FilterPillBar
                  ariaLabel="Filter collectors"
                  options={STATUS_FILTERS}
                  value={statusFilter}
                  onChange={setStatusFilter}
                />
              }
              actions={
                <>
                  <ExportCsvButton
                    label="Export"
                    showDownloadIcon
                    filename="collectors.csv"
                    reportType={WILMS_REPORT_TYPE.COLLECTOR_LIST}
                    reportTitle="Collectors Management Export"
                    headers={[
                      'Collector ID',
                      'Full Name',
                      'Assigned Zone',
                      'Assigned Groups',
                      'Assigned Borrowers',
                      'Expected (GHS)',
                      'Collected (GHS)',
                      'Collection Rate',
                      'Status',
                    ]}
                    rows={csvRows}
                  />
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setOnboardModalOpen(true)}
                  >
                    + Add Collector
                  </Button>
                </>
              }
            />
            <CollectorsMobileCardList
              collectors={slice}
              selectedId={selected?.id}
              onSelect={setSelectedId}
            />
            <div className="hidden lg:block">
              <DataTable<CollectorSummary>
                variant="executive"
                caption="Collectors"
                data={slice}
                getRowId={(row) => row.id}
                selectedRowId={selected?.id}
                onRowClick={(row) => setSelectedId(row.id)}
                columns={[
                  {
                    id: 'name',
                    header: 'Collector',
                    cell: (row) => (
                      <div className="flex items-center gap-wilms-3">
                        <Avatar
                          label={row.displayName}
                          photoUrl={resolveEntityPhotoUrl({
                            name: row.displayName,
                            id: row.id,
                            photoUrl: row.photoUrl,
                          })}
                          size="sm"
                        />
                        <div>
                          <p className="font-semibold text-text-primary">{row.displayName}</p>
                          <p className="text-small font-semibold text-executive-gold">
                            {resolveCollectorDisplayId(row)}
                          </p>
                        </div>
                      </div>
                    ),
                  },
                  { id: 'zone', header: 'Zone', cell: (row) => row.zone },
                  { id: 'groups', header: 'Groups', cell: (row) => row.groupCount },
                  { id: 'borrowers', header: 'Borrowers', cell: (row) => row.borrowerCount },
                  {
                    id: 'expected',
                    header: 'Expected',
                    cell: (row) => <CurrencyAmount value={row.expectedPesewas} />,
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
                      <span
                        className={`font-semibold ${collectorRateTextClass(row.collectionRatePercent)}`}
                      >
                        {row.collectionRatePercent}%
                      </span>
                    ),
                  },
                  {
                    id: 'trend',
                    header: 'Trend',
                    cell: (row) => <Sparkline values={row.rateTrend} />,
                  },
                  {
                    id: 'streak',
                    header: 'Streak',
                    cell: (row) =>
                      row.streakWeeks > 0 ? (
                        <span className="inline-flex items-center gap-wilms-1 font-semibold text-executive-gold">
                          <CollectorStreakIcon />
                          {row.streakWeeks}w
                        </span>
                      ) : (
                        '—'
                      ),
                  },
                ]}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-wilms-3">
              <p className="text-small text-text-muted">
                Showing {slice.length} of {total} collectors
              </p>
              <Pagination
                page={page}
                pageCount={pageCount}
                onPageChange={setPage}
                ariaLabel="Collectors pagination"
              />
            </div>
          </div>
        ) : null}
      </QueryStatePanel>

      <Modal
        isOpen={onboardModalOpen}
        onClose={() => setOnboardModalOpen(false)}
        title="Onboard Collector"
        footer={
          <>
            <Button type="button" variant="secondary" size="sm" onClick={() => setOnboardModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={
                onboardCollector.isPending || !displayName.trim() || !email.trim() || !zone.trim()
              }
              onClick={() => {
                void onboardCollector
                  .mutateAsync({
                    displayName: displayName.trim(),
                    email: email.trim(),
                    zone: zone.trim(),
                  })
                  .then(() => {
                    setOnboardModalOpen(false);
                    setDisplayName('');
                    setEmail('');
                    setZone('');
                  });
              }}
            >
              {onboardCollector.isPending ? 'Adding…' : 'Add Collector'}
            </Button>
          </>
        }
      >
        <div className="space-y-wilms-4">
          <div>
            <label htmlFor="collector-name" className="text-small font-semibold text-text-primary">
              Full name
            </label>
            <Input
              id="collector-name"
              className="mt-wilms-2"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="collector-email" className="text-small font-semibold text-text-primary">
              Email
            </label>
            <Input
              id="collector-email"
              type="email"
              className="mt-wilms-2"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="collector-zone" className="text-small font-semibold text-text-primary">
              Assigned zone
            </label>
            <Input
              id="collector-zone"
              className="mt-wilms-2"
              value={zone}
              onChange={(event) => setZone(event.target.value)}
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={messageModalOpen}
        onClose={closeMessageModal}
        title={messageCollector ? `Message ${messageCollector.displayName}` : 'Message Collector'}
        footer={
          <>
            <Button type="button" variant="secondary" size="sm" onClick={closeMessageModal}>
              Close
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={
                !threadId || !messageBody.trim() || sendMessage.isPending || createThread.isPending
              }
              onClick={() => {
                if (!threadId) {
                  return;
                }

                void sendMessage
                  .mutateAsync({ threadId, body: messageBody.trim() })
                  .then(() => setMessageBody(''));
              }}
            >
              {sendMessage.isPending ? 'Sending…' : 'Send'}
            </Button>
          </>
        }
      >
        <div className="space-y-wilms-4">
          {createThread.isPending ? (
            <p className="text-small text-text-muted">Opening conversation…</p>
          ) : null}
          {thread?.messages.length ? (
            <ul className="max-h-48 space-y-wilms-2 overflow-y-auto text-small">
              {thread.messages.map((message) => (
                <li key={message.id} className="rounded-sm border border-border p-wilms-2">
                  <p className="font-semibold text-text-primary">{message.senderDisplayName}</p>
                  <p className="text-text-muted">{message.body}</p>
                </li>
              ))}
            </ul>
          ) : null}
          <Textarea
            aria-label="Message body"
            placeholder="Write your message..."
            value={messageBody}
            onChange={(event) => setMessageBody(event.target.value)}
          />
        </div>
      </Modal>
    </>
  );
}
