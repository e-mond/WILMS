'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CurrencyAmount, DataTable, KpiCard } from '@/components/data-display';
import { EmptyState } from '@/components/feedback/EmptyState';
import { resolveQueryErrorPresentation } from '@/utils/query-error-presentation';
import { EMPTY_STATE_COPY } from '@/constants/empty-state-copy';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { ExecutiveKpiGrid, FilterDropdown, FilterDropdownRow, ManagementToolbar } from '@/components/layout/executive';
import { useQueryLoadingPolicy } from '@/hooks/useQueryLoadingPolicy';
import { ExportDownloadIcon } from '@/components/icons/ExportDownloadIcon';
import { ReportsAsidePanel } from '@/features/reports/components/ReportsAsidePanel';
import {
  buildTabularExportDocument,
  useWilmsExportActor,
  WilmsExportActions,
  WILMS_REPORT_TYPE,
} from '@/features/export';
import { Input } from '@/components/ui/Input';
import { useReportsIndex } from '@/features/reports/hooks/useReportsIndex';
import { useDashboardSummary } from '@/features/super-admin-dashboard/hooks/useDashboardSummary';
import { useShellAsideContent } from '@/hooks/useShellAsideContent';
import { REPORT_CATEGORY_LABELS } from '@/constants/report-display';
import {
  AUDITOR_REPORT_CATEGORY_FILTERS,
  matchesAuditorReportCategory,
  type AuditorReportCategoryFilter,
} from '@/constants/auditor-report-filters';
import type { DashboardSummary } from '@/types/dashboard';
import type { ReportSummary } from '@/types/services';
import { formatDisplayDate } from '@/utils/format-date';

const DEFAULT_REPORT_TYPE_FILTERS = [
  { value: '', label: 'All reports' },
  { value: 'collection', label: 'Collection' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'risk', label: 'Risk' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'operations', label: 'Operations' },
];

export interface ReportsIndexPanelProps {
  categoryFilterMode?: 'default' | 'auditor';
}

function resolveReportKpis(summary: DashboardSummary) {
  const collectedPesewas =
    summary.kpis.find((kpi) => kpi.id === 'collected')?.amountPesewas ?? 0;
  const outstandingPesewas =
    summary.kpis.find((kpi) => kpi.id === 'outstanding')?.amountPesewas ?? 0;
  const disbursedPesewas = summary.kpis.find((kpi) => kpi.id === 'disbursed')?.amountPesewas ?? 0;
  const activeBorrowers =
    summary.borrowerSegments.find((segment) => segment.id === 'active')?.count ?? 0;
  const recoveryRatePercent =
    disbursedPesewas > 0 ? Math.round((collectedPesewas / disbursedPesewas) * 100) : 0;

  return {
    totalCollectionsPesewas: collectedPesewas,
    outstandingBalancePesewas: outstandingPesewas,
    recoveryRatePercent,
    activeBorrowers,
  };
}

export function ReportsIndexPanel({ categoryFilterMode = 'default' }: ReportsIndexPanelProps) {
  const generatedBy = useWilmsExportActor();
  const { data, isLoading, isError, error, refetch } = useReportsIndex();
  const { data: dashboardSummary, isLoading: isDashboardLoading, refetch: refetchDashboard } =
    useDashboardSummary();
  const { showLoading, isTimedOut, isForbidden } = useQueryLoadingPolicy({
    isLoading: isLoading || isDashboardLoading,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const reportKpis = useMemo(
    () => (dashboardSummary ? resolveReportKpis(dashboardSummary) : null),
    [dashboardSummary],
  );

  const categoryFilterOptions =
    categoryFilterMode === 'auditor'
      ? AUDITOR_REPORT_CATEGORY_FILTERS.map((option) => ({ ...option }))
      : DEFAULT_REPORT_TYPE_FILTERS;

  const reports = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return (data ?? []).filter((report) => {
      const matchesSearch =
        !query ||
        report.title.toLowerCase().includes(query) ||
        report.description.toLowerCase().includes(query);
      const matchesType =
        categoryFilterMode === 'auditor'
          ? matchesAuditorReportCategory(report, typeFilter as AuditorReportCategoryFilter)
          : !typeFilter || report.category === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [categoryFilterMode, data, searchQuery, typeFilter]);

  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedReportId) ?? reports[0] ?? null,
    [reports, selectedReportId],
  );

  const exportDocument = useMemo(
    () =>
      buildTabularExportDocument({
        reportType: WILMS_REPORT_TYPE.GENERIC_REPORT,
        reportTitle: 'WILMS Reports Index',
        generatedBy,
        headers: ['Report', 'Category', 'Records', 'Route'],
        rows: reports.map((report) => [
          report.title,
          REPORT_CATEGORY_LABELS[report.category],
          String(report.recordCount),
          report.route,
        ]),
      }),
    [generatedBy, reports],
  );

  const asideContent = useMemo(
    () => (data ? <ReportsAsidePanel selectedReport={selectedReport} /> : null),
    [data, selectedReport],
  );
  useShellAsideContent(asideContent);

  if (isError) {
    const presentation = resolveQueryErrorPresentation(error);
    return (
      <EmptyState title={presentation.title} description={presentation.description} />
    );
  }

  if (isTimedOut && (isLoading || isDashboardLoading)) {
    return (
      <QueryStatePanel
        isLoading
        isTimedOut
        isError={false}
        isForbidden={isForbidden}
        onRetry={() => {
          void refetch();
          void refetchDashboard();
        }}
        variant="inline"
      >
        {null}
      </QueryStatePanel>
    );
  }

  if (showLoading && isLoading) {
    return (
      <QueryStatePanel isLoading showLoading isError={false} variant="inline">
        {null}
      </QueryStatePanel>
    );
  }

  if (!data) {
    if (isLoading) {
      return (
        <QueryStatePanel isLoading showLoading isError={false} variant="inline">
          {null}
        </QueryStatePanel>
      );
    }

    return <EmptyState {...EMPTY_STATE_COPY.reports} />;
  }

  if (data.length === 0 && reports.length === 0 && !searchQuery && !typeFilter) {
    return <EmptyState {...EMPTY_STATE_COPY.reports} />;
  }

  return (
    <div className="space-y-wilms-4">
      {reportKpis ? (
        <ExecutiveKpiGrid>
          <KpiCard
            variant="executive"
            label="Total Collections"
            value={<CurrencyAmount value={reportKpis.totalCollectionsPesewas} />}
            valueClassName="text-brand-primary"
          />
          <KpiCard
            variant="executive"
            label="Outstanding Balance"
            value={<CurrencyAmount value={reportKpis.outstandingBalancePesewas} />}
            valueClassName="text-danger"
          />
          <KpiCard
            variant="executive"
            label="Recovery Rate"
            value={`${reportKpis.recoveryRatePercent}%`}
            valueClassName="text-status-active"
          />
          <KpiCard
            variant="executive"
            label="Active Borrowers"
            value={reportKpis.activeBorrowers.toLocaleString()}
            valueClassName="text-executive-gold"
          />
        </ExecutiveKpiGrid>
      ) : null}

      <ManagementToolbar
        search={
          <Input
            aria-label="Search reports"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        }
        filters={
          <FilterDropdownRow>
            <FilterDropdown
              label="Category"
              ariaLabel="Filter report types"
              options={categoryFilterOptions}
              value={typeFilter}
              onChange={setTypeFilter}
            />
          </FilterDropdownRow>
        }
        actions={
          <WilmsExportActions document={exportDocument} filenameBase="reports-index" showIcons />
        }
      />

      <DataTable<ReportSummary>
        variant="executive"
        caption="Available reports"
        data={reports}
        getRowId={(row) => row.id}
        selectedRowId={selectedReport?.id}
        onRowClick={(row) => setSelectedReportId(row.id)}
        className="hidden md:block"
        columns={[
          {
            id: 'title',
            header: 'Report',
            cell: (row) => (
              <Link href={row.route} className="font-semibold text-brand-primary hover:underline">
                {row.title}
              </Link>
            ),
          },
          {
            id: 'type',
            header: 'Category',
            cell: (row) => REPORT_CATEGORY_LABELS[row.category],
          },
          {
            id: 'records',
            header: 'Records',
            cell: (row) => row.recordCount.toLocaleString(),
          },
          {
            id: 'generated',
            header: 'Last Generated',
            cell: (row) => formatDisplayDate(row.generatedAt.slice(0, 10)),
          },
          {
            id: 'action',
            header: 'Action',
            cell: (row) => (
              <Link
                href={row.route}
                className="inline-flex items-center gap-wilms-2 text-small font-semibold text-text-primary hover:text-brand-primary"
              >
                <ExportDownloadIcon />
                Open
              </Link>
            ),
          },
        ]}
      />

      <ul className="grid gap-wilms-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {reports.map((report) => (
          <li key={report.id}>
            <button
              type="button"
              onClick={() => setSelectedReportId(report.id)}
              className="block w-full rounded-sm border border-border bg-card p-wilms-3 text-left transition-colors hover:border-brand-primary hover:bg-brand-primary-light data-[selected=true]:border-executive-gold data-[selected=true]:bg-brand-primary-light"
              data-selected={selectedReport?.id === report.id}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                {REPORT_CATEGORY_LABELS[report.category]}
              </p>
              <p className="mt-wilms-1 text-body font-semibold text-brand-primary">{report.title}</p>
              <p className="mt-wilms-1 line-clamp-2 text-small text-text-muted">{report.description}</p>
              <p className="mt-wilms-2 text-small text-text-muted">
                {report.recordCount.toLocaleString()} records ·{' '}
                {formatDisplayDate(report.generatedAt.slice(0, 10))}
              </p>
              <Link
                href={report.route}
                className="mt-wilms-2 inline-flex text-small font-semibold text-text-primary hover:text-brand-primary"
                onClick={(event) => event.stopPropagation()}
              >
                Open report →
              </Link>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
