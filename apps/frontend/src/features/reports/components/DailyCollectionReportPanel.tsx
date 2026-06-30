'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CurrencyAmount, DataTable, KpiCard } from '@/components/data-display';
import { ExecutiveKpiGrid, ManagementToolbar } from '@/components/layout/executive';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ExportCsvButton } from '@/features/reports/components/ExportCsvButton';
import { WILMS_REPORT_TYPE } from '@/features/export';
import { CollectionsAsidePanel } from '@/features/reports/components/CollectionsAsidePanel';
import { useDailyCollectionReport } from '@/features/reports/hooks/useDailyCollectionReport';
import { useShellAsideContent } from '@/hooks/useShellAsideContent';
import { collectorManagementService } from '@/services';
import type { CollectorListResponse } from '@/types/collector-management';
import type { DailyCollectionReportRow } from '@/types/reports';
import { formatDisplayDate } from '@/utils/format-date';
import { formatPesewasForCsv } from '@/utils/export-csv';

const CSV_HEADERS = [
  'Borrower',
  'Community',
  'Collector',
  'Expected (GHS)',
  'Collected (GHS)',
  'Variance (GHS)',
  'Recorded At',
];

function defaultReportDate(): string {
  return '2026-05-23';
}

export function DailyCollectionReportPanel() {
  const [reportDate, setReportDate] = useState(defaultReportDate);
  const [collectorFilter, setCollectorFilter] = useState('');

  const collectorsQuery = useQuery({
    queryKey: ['collectors-filter'],
    queryFn: (): Promise<CollectorListResponse> => collectorManagementService.listCollectors(),
  });

  const collectorFilterOptions = useMemo(
    () => [
      { value: '', label: 'All collectors' },
      ...(collectorsQuery.data?.collectors ?? []).map((collector) => ({
        value: collector.id,
        label: collector.displayName,
      })),
    ],
    [collectorsQuery.data],
  );

  const { data, isLoading, isError, refetch } = useDailyCollectionReport({
    date: reportDate,
    collectorId: collectorFilter || undefined,
  });

  const csvRows = useMemo(
    () =>
      (data?.rows ?? []).map((row) => [
        row.borrowerName,
        row.community,
        row.collectorName,
        formatPesewasForCsv(row.expectedPesewas),
        formatPesewasForCsv(row.collectedPesewas),
        formatPesewasForCsv(row.variancePesewas),
        row.recordedAt ?? '—',
      ]),
    [data?.rows],
  );

  const asideContent = useMemo(
    () =>
      data?.summary ? (
        <CollectionsAsidePanel
          reportDate={data.summary.date}
          borrowersDue={data.summary.borrowersDueCount}
          borrowersPaid={data.summary.borrowersPaidCount}
          collectedPesewas={data.summary.collectedPesewas}
          variancePesewas={data.summary.variancePesewas}
        />
      ) : null,
    [data],
  );

  useShellAsideContent(asideContent);

  return (
    <QueryStatePanel
      isLoading={isLoading}
      isError={isError || !data}
      errorMessage="Check your connection and try again."
      onRetry={() => void refetch()}
      variant="table"
    >
      {data ? (
    <div className="space-y-wilms-4">
      <ExecutiveKpiGrid>
        <KpiCard variant="executive" label="Borrowers Due" value={data.summary.borrowersDueCount} />
        <KpiCard
          variant="executive"
          label="Borrowers Paid"
          value={data.summary.borrowersPaidCount}
          valueClassName="text-status-active"
        />
        <KpiCard
          variant="executive"
          label="Expected Collections"
          value={<CurrencyAmount value={data.summary.expectedPesewas} />}
          valueClassName="text-brand-primary"
        />
        <KpiCard
          variant="executive"
          label="Collected"
          value={<CurrencyAmount value={data.summary.collectedPesewas} />}
          valueClassName="text-status-active"
        />
      </ExecutiveKpiGrid>

      <ManagementToolbar
        search={
          <div className="grid gap-wilms-3 sm:grid-cols-2">
            <Input
              aria-label="Report date"
              type="date"
              value={reportDate}
              onChange={(event) => setReportDate(event.target.value)}
            />
            <Select
              aria-label="Filter by collector"
              value={collectorFilter}
              onChange={(event) => setCollectorFilter(event.target.value)}
            >
              {collectorFilterOptions.map((option) => (
                <option key={option.value || 'all-collectors'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        }
        actions={
          <ExportCsvButton
            label="Export"
            filename={`daily-collection-${data.summary.date}.csv`}
            reportType={WILMS_REPORT_TYPE.DAILY_COLLECTION}
            reportTitle={`Daily Collection Report — ${data.summary.date}`}
            headers={CSV_HEADERS}
            rows={csvRows}
          />
        }
      />

      <p className="text-small text-text-muted">
        {formatDisplayDate(data.summary.date)} · {data.summary.paymentDayLabel} · {data.rows.length}{' '}
        rows
      </p>

      {data.summary.variancePesewas !== 0 ? (
        <p className="text-body text-text-muted">
          Variance: <CurrencyAmount value={Math.abs(data.summary.variancePesewas)} />
          {data.summary.variancePesewas < 0 ? ' below expected' : ' above expected'}
        </p>
      ) : (
        <p className="text-body font-semibold text-status-active">
          Collections match expected totals for due borrowers.
        </p>
      )}

      {data.rows.length === 0 ? (
        <EmptyState
          title="No collection activity"
          description="No repayments or due borrowers were recorded for this date."
        />
      ) : (
        <DataTable<DailyCollectionReportRow>
          variant="executive"
          caption="Daily collection report"
          data={data.rows}
          getRowId={(row) => row.id}
          columns={[
            {
              id: 'borrower',
              header: 'Borrower',
              cell: (row) => (
                <div>
                  <p className="font-semibold text-text-primary">{row.borrowerName}</p>
                  <p className="text-small text-text-muted">{row.community}</p>
                </div>
              ),
            },
            { id: 'collector', header: 'Collector', cell: (row) => row.collectorName },
            {
              id: 'expected',
              header: 'Expected',
              cell: (row) =>
                row.expectedPesewas > 0 ? (
                  <CurrencyAmount value={row.expectedPesewas} />
                ) : (
                  '—'
                ),
            },
            {
              id: 'collected',
              header: 'Collected',
              cell: (row) =>
                row.collectedPesewas > 0 ? (
                  <CurrencyAmount value={row.collectedPesewas} />
                ) : (
                  '—'
                ),
            },
            {
              id: 'variance',
              header: 'Variance',
              cell: (row) => (
                <span
                  className={
                    row.variancePesewas > 0
                      ? 'font-semibold text-status-active'
                      : row.variancePesewas < 0
                        ? 'font-semibold text-danger'
                        : 'text-text-muted'
                  }
                >
                  {row.variancePesewas === 0 ? (
                    '—'
                  ) : (
                    <CurrencyAmount value={Math.abs(row.variancePesewas)} />
                  )}
                </span>
              ),
            },
            {
              id: 'recordedAt',
              header: 'Recorded',
              cell: (row) =>
                row.recordedAt ? formatDisplayDate(row.recordedAt.slice(0, 10)) : 'Pending',
            },
          ]}
        />
      )}
    </div>
      ) : null}
    </QueryStatePanel>
  );
}
