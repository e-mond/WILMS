'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/data-display';
import { EmptyState } from '@/components/feedback/EmptyState';
import { resolveQueryErrorPresentation } from '@/utils/query-error-presentation';
import { EMPTY_STATE_COPY } from '@/constants/empty-state-copy';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { FilterDropdown, FilterDropdownRow, ManagementToolbar } from '@/components/layout/executive';
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
import { useShellAsideContent } from '@/hooks/useShellAsideContent';
import { REPORT_CATEGORY_LABELS } from '@/constants/report-display';
import {
  AUDITOR_REPORT_CATEGORY_FILTERS,
  matchesAuditorReportCategory,
  type AuditorReportCategoryFilter,
} from '@/constants/auditor-report-filters';
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

export function ReportsIndexPanel({ categoryFilterMode = 'default' }: ReportsIndexPanelProps) {
  const generatedBy = useWilmsExportActor();
  const { data, isLoading, isError, error, refetch } = useReportsIndex();
  const { showLoading, isTimedOut, isForbidden } = useQueryLoadingPolicy({
    isLoading,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

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

  if (isTimedOut && isLoading) {
    return (
      <QueryStatePanel
        isLoading
        isTimedOut
        isError={false}
        isForbidden={isForbidden}
        onRetry={() => {
          void refetch();
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
          <WilmsExportActions document={exportDocument} filenameBase="WILMS_Reports_Index" showIcons />
        }
      />

      <DataTable<ReportSummary>
        variant="executive"
        caption="Available reports"
        data={reports}
        getRowId={(row) => row.id}
        selectedRowId={selectedReport?.id}
        onRowClick={(row) => setSelectedReportId(row.id)}
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
    </div>
  );
}
