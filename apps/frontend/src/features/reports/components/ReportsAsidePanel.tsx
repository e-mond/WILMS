'use client';

import Link from 'next/link';
import { MetricDistributionChart } from '@/components/data-display';
import { DetailSidebarCard } from '@/components/layout/executive';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { useQueryLoadingPolicy } from '@/hooks/useQueryLoadingPolicy';
import { useReportsHubMetadata } from '@/features/reports/hooks/useReportsHubMetadata';
import { REPORT_CATEGORY_LABELS } from '@/constants/report-display';
import type { ReportSummary } from '@/types/services';
import { formatDisplayDate } from '@/utils/format-date';

const CATEGORY_TONE: Record<
  keyof typeof REPORT_CATEGORY_LABELS,
  'default' | 'warning' | 'danger' | 'primary'
> = {
  collection: 'primary',
  portfolio: 'default',
  risk: 'danger',
  compliance: 'warning',
  operations: 'primary',
};

export interface ReportsAsidePanelProps {
  selectedReport?: ReportSummary | null;
}

export function ReportsAsidePanel({ selectedReport = null }: ReportsAsidePanelProps) {
  const { data, isLoading, isError, refetch } = useReportsHubMetadata();
  const { showLoading, isTimedOut } = useQueryLoadingPolicy({ isLoading });

  return (
    <QueryStatePanel
      isLoading={isLoading}
      showLoading={showLoading}
      isTimedOut={isTimedOut}
      isError={isError}
      errorMessage="Unable to load report insights."
      onRetry={() => void refetch()}
      variant="cards"
    >
      {data ? (
        <ReportsAsideContent data={data} selectedReport={selectedReport} />
      ) : null}
    </QueryStatePanel>
  );
}

function ReportsAsideContent({
  data,
  selectedReport,
}: {
  data: NonNullable<ReturnType<typeof useReportsHubMetadata>['data']>;
  selectedReport: ReportSummary | null;
}) {
  const categoryBreakdown = data.categoryBreakdown ?? [];
  const scheduledReports = data.scheduledReports ?? [];
  const recentExports = data.recentExports ?? [];
  const lastComplianceExport = data.lastComplianceExport;

  return (
    <>
      {selectedReport ? (
        <DetailSidebarCard
          eyebrow={REPORT_CATEGORY_LABELS[selectedReport.category]}
          title={selectedReport.title}
          subtitle={selectedReport.description}
        >
          <dl className="mt-wilms-4 space-y-wilms-3 text-small">
            <div>
              <dt className="text-text-muted">Records</dt>
              <dd className="font-semibold text-text-primary">
                {selectedReport.recordCount.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-text-muted">Last generated</dt>
              <dd className="font-semibold">{formatDisplayDate(selectedReport.generatedAt.slice(0, 10))}</dd>
            </div>
          </dl>
          <Link
            href={selectedReport.route}
            className="mt-wilms-4 inline-flex text-small font-semibold text-brand-primary hover:underline"
          >
            Open full report →
          </Link>
        </DetailSidebarCard>
      ) : null}

      <DetailSidebarCard title="Report Categories">
        <MetricDistributionChart
          className="mt-wilms-3"
          items={categoryBreakdown.map((entry) => ({
            id: entry.id,
            label: entry.label,
            count: entry.count,
            tone: CATEGORY_TONE[entry.id],
          }))}
        />
      </DetailSidebarCard>

      <DetailSidebarCard title="Scheduled Reports">
        {scheduledReports.length === 0 ? (
          <p className="mt-wilms-3 text-small text-text-muted">No scheduled reports yet.</p>
        ) : (
          <ul className="mt-wilms-3 space-y-wilms-2 text-small">
            {scheduledReports.map((entry) => (
              <li key={entry.id}>
                <p className="font-semibold text-text-primary">{entry.title}</p>
                <p className="text-text-muted">{entry.scheduleLabel}</p>
              </li>
            ))}
          </ul>
        )}
      </DetailSidebarCard>

      <DetailSidebarCard title="Recent Exports">
        {recentExports.length === 0 ? (
          <p className="mt-wilms-3 text-small text-text-muted">No recent exports.</p>
        ) : (
          <ul className="mt-wilms-3 space-y-wilms-2 text-small text-text-muted">
            {recentExports.map((entry) => (
              <li key={entry.id}>{entry.label}</li>
            ))}
          </ul>
        )}
      </DetailSidebarCard>

      {lastComplianceExport ? (
        <DetailSidebarCard title="Report History">
          <p className="mt-wilms-3 text-small text-text-muted">
            Last compliance export generated{' '}
            {formatDisplayDate(lastComplianceExport.exportedAt.slice(0, 10))} at{' '}
            {new Date(lastComplianceExport.exportedAt).toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'UTC',
              timeZoneName: 'short',
            })}{' '}
            by {lastComplianceExport.exportedBy}.
          </p>
        </DetailSidebarCard>
      ) : null}

      <DetailSidebarCard title="Quick Actions">
        <ul className="mt-wilms-3 space-y-wilms-2 text-small">
          <li>
            <Link href="/reports/daily-collection" className="font-semibold text-brand-primary hover:underline">
              Daily Collection Report
            </Link>
          </li>
          <li>
            <Link href="/reports/audit-log" className="font-semibold text-brand-primary hover:underline">
              Audit Log Report
            </Link>
          </li>
        </ul>
      </DetailSidebarCard>
    </>
  );
}
