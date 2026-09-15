'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CurrencyAmount, DataTable, KpiCard } from '@/components/data-display';
import { ExecutiveKpiGrid, ManagementToolbar } from '@/components/layout/executive';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { GuidedEmptyState } from '@/components/feedback/GuidedEmptyState';
import { EMPTY_STATE_COPY } from '@/constants/empty-state-copy';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ExportCsvButton } from '@/features/reports/components/ExportCsvButton';
import { WILMS_REPORT_TYPE } from '@/features/export';
import { CollectionsAsidePanel } from '@/features/reports/components/CollectionsAsidePanel';
import { ReconciliationReviewQueue } from '@/features/reconciliation/components/ReconciliationReviewQueue';
import { useReconciliationList } from '@/features/reconciliation/hooks/useReconciliationReview';
import { useDailyCollectionReport } from '@/features/reports/hooks/useDailyCollectionReport';
import { useShellAsideContent } from '@/hooks/useShellAsideContent';
import { collectorManagementService } from '@/services';
import type { CollectorListResponse } from '@/types/collector-management';
import type { DailyCollectionReportRow } from '@/types/reports';
import { formatDisplayDate } from '@/utils/format-date';
import { formatPesewasForCsv } from '@/utils/export-csv';
import { summarizeReconciliationsForDate } from '@/utils/reconciliation-review';
import { cn } from '@/utils/cn';

const CSV_HEADERS = [
  'Borrower',
  'Community',
  'Collector',
  'Expected (GHS)',
  'Collected (GHS)',
  'Variance (GHS)',
  'GPS',
  'Recorded At',
];

function defaultReportDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DailyCollectionReportPanel() {
  const [reportDate, setReportDate] = useState(defaultReportDate);
  const [collectorFilter, setCollectorFilter] = useState('');

  const collectorsQuery = useQuery({
    queryKey: ['collectors-filter'],
    queryFn: (): Promise<CollectorListResponse> => collectorManagementService.listCollectors(),
    retry: 1,
    throwOnError: false,
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

  const { data, isLoading, isError, error, refetch } = useDailyCollectionReport({
    date: reportDate,
    collectorId: collectorFilter || undefined,
  });
  const reconciliationsQuery = useReconciliationList();

  const reconciliationSummary = useMemo(
    () => summarizeReconciliationsForDate(reconciliationsQuery.data ?? [], reportDate),
    [reconciliationsQuery.data, reportDate],
  );

  const csvRows = useMemo(
    () =>
      (data?.rows ?? []).map((row) => [
        row.borrowerName,
        row.community,
        row.collectorName,
        formatPesewasForCsv(row.expectedPesewas),
        formatPesewasForCsv(row.collectedPesewas),
        formatPesewasForCsv(row.variancePesewas),
        row.gpsSummary ?? 'Not captured',
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
          expectedPesewas={data.summary.expectedPesewas}
          collectedPesewas={data.summary.collectedPesewas}
          variancePesewas={data.summary.variancePesewas}
          reconciliationSubmittedCount={reconciliationSummary.submittedCount}
          reconciliationApprovedCount={reconciliationSummary.approvedCount}
          reconciliationUnderReviewCount={reconciliationSummary.underReviewCount}
        />
      ) : null,
    [data, reconciliationSummary],
  );

  useShellAsideContent(asideContent);

  return (
    <QueryStatePanel
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={() => void refetch()}
      variant="table"
    >
      {data ? (
    <div className="space-y-wilms-5" data-testid="daily-collection-report">
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card">
        <div className="bg-gradient-to-br from-brand-primary/[0.07] via-transparent to-transparent px-wilms-5 py-wilms-5 sm:px-wilms-6">
          <div className="flex flex-col gap-wilms-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-small font-semibold uppercase tracking-wide text-brand-primary">
                Field collections
              </p>
              <h1 className="mt-wilms-1 text-heading-1 font-semibold text-text-primary">
                Daily collection
              </h1>
              <p className="mt-wilms-1 text-small text-text-muted">
                {formatDisplayDate(data.summary.date)} · {data.summary.paymentDayLabel} ·{' '}
                {data.rows.length} rows
              </p>
            </div>
            <div
              className={cn(
                'rounded-xl border px-3 py-2 text-small font-semibold',
                data.summary.variancePesewas === 0
                  ? 'border-status-active/30 bg-status-active/10 text-status-active'
                  : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300',
              )}
            >
              {data.summary.variancePesewas === 0 ? (
                'Collections match expected totals'
              ) : (
                <>
                  Variance{' '}
                  <CurrencyAmount value={Math.abs(data.summary.variancePesewas)} className="text-small" />
                  {data.summary.variancePesewas < 0 ? ' below' : ' above'} expected
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div data-tour="collection-kpis">
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
      </div>

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
            filename={`WILMS_Group_Collection_Report_${data.summary.date}.csv`}
            reportType={WILMS_REPORT_TYPE.DAILY_COLLECTION}
            reportTitle={`Daily Collection Report — ${data.summary.date}`}
            headers={CSV_HEADERS}
            rows={csvRows}
          />
        }
      />

      <ReconciliationReviewQueue />

      {data.rows.length === 0 ? (
        <GuidedEmptyState
          {...EMPTY_STATE_COPY.payments}
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
              id: 'gps',
              header: 'GPS',
              cell: (row) => (
                <span className="text-small text-text-muted">{row.gpsSummary ?? 'Not captured'}</span>
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
