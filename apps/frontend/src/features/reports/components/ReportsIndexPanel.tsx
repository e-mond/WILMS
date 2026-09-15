'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, FileBarChart2 } from 'lucide-react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { resolveQueryErrorPresentation } from '@/utils/query-error-presentation';
import { EMPTY_STATE_COPY } from '@/constants/empty-state-copy';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { FilterDropdown, FilterDropdownRow, ManagementToolbar } from '@/components/layout/executive';
import { useQueryLoadingPolicy } from '@/hooks/useQueryLoadingPolicy';
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
import { formatDisplayDate } from '@/utils/format-date';
import { cn } from '@/utils/cn';

const DEFAULT_REPORT_TYPE_FILTERS = [
  { value: '', label: 'All reports' },
  { value: 'collection', label: 'Collection' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'risk', label: 'Risk' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'operations', label: 'Operations' },
];

const CATEGORY_TONE: Record<string, string> = {
  collection:
    'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-400',
  portfolio:
    'border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/40 dark:text-sky-400',
  risk: 'border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-400',
  compliance:
    'border-violet-100 bg-violet-50 text-violet-700 dark:border-violet-900/40 dark:bg-violet-950/40 dark:text-violet-400',
  operations:
    'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

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
    return <EmptyState title={presentation.title} description={presentation.description} />;
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
    <div className="space-y-wilms-5">
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card">
        <div className="bg-gradient-to-br from-brand-primary/[0.08] via-transparent to-transparent px-wilms-5 py-wilms-5 sm:px-wilms-6">
          <div className="flex flex-col gap-wilms-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-small font-semibold uppercase tracking-wide text-brand-primary">
                Insights
              </p>
              <h1 className="mt-wilms-1 text-heading-1 font-semibold text-text-primary">Reports</h1>
              <p className="mt-wilms-1 max-w-2xl text-small text-text-muted">
                Open financial and operational reports. Export PDF, Excel, CSV, or Word from each
                report toolbar.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card/80 px-3 py-2 text-small text-text-muted">
              <FileBarChart2 className="h-4 w-4 text-brand-primary" aria-hidden="true" />
              {reports.length} available
            </div>
          </div>
        </div>
      </div>

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

      {reports.length === 0 ? (
        <EmptyState
          title="No reports match your filters"
          description="Try another category or search term."
        />
      ) : (
        <ul className="grid gap-wilms-3 sm:grid-cols-2 xl:grid-cols-3">
          {reports.map((report) => {
            const selected = selectedReport?.id === report.id;
            return (
              <li key={report.id}>
                <button
                  type="button"
                  onClick={() => setSelectedReportId(report.id)}
                  className={cn(
                    'flex h-full w-full flex-col rounded-2xl border bg-card p-wilms-4 text-left transition-all',
                    selected
                      ? 'border-brand-primary/50 shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-brand-primary)_25%,transparent)]'
                      : 'border-border/80 hover:border-brand-primary/35',
                  )}
                >
                  <div className="flex items-start justify-between gap-wilms-3">
                    <span
                      className={cn(
                        'inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                        CATEGORY_TONE[report.category] ?? CATEGORY_TONE.operations,
                      )}
                    >
                      {REPORT_CATEGORY_LABELS[report.category]}
                    </span>
                    <span className="text-small tabular-nums text-text-muted">
                      {report.recordCount.toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-wilms-3 text-body font-semibold text-text-primary">
                    <Link href={report.route} className="hover:text-brand-primary hover:underline">
                      {report.title}
                    </Link>
                  </p>
                  <p className="mt-wilms-1 line-clamp-2 text-small text-text-muted">
                    {report.description}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-wilms-2 pt-wilms-4">
                    <span className="text-[11px] text-text-muted">
                      Updated {formatDisplayDate(report.generatedAt.slice(0, 10))}
                    </span>
                    <Link
                      href={report.route}
                      className="inline-flex items-center gap-1 text-small font-semibold text-brand-primary hover:underline"
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`Open ${report.title}`}
                    >
                      Open
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
