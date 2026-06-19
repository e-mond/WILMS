'use client';

import Link from 'next/link';
import { MetricDistributionChart } from '@/components/data-display';
import { DetailSidebarCard } from '@/components/layout/executive';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
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
  const { data, isLoading } = useReportsHubMetadata();

  if (isLoading || !data) {
    return <LoadingSpinner label="Loading report insights" className="py-wilms-4" />;
  }

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
          items={data.categoryBreakdown.map((entry) => ({
            id: entry.id,
            label: entry.label,
            count: entry.count,
            tone: CATEGORY_TONE[entry.id],
          }))}
        />
      </DetailSidebarCard>

      <DetailSidebarCard title="Scheduled Reports">
        <ul className="mt-wilms-3 space-y-wilms-2 text-small">
          {data.scheduledReports.map((entry) => (
            <li key={entry.id}>
              <p className="font-semibold text-text-primary">{entry.title}</p>
              <p className="text-text-muted">{entry.scheduleLabel}</p>
            </li>
          ))}
        </ul>
      </DetailSidebarCard>

      <DetailSidebarCard title="Recent Exports">
        <ul className="mt-wilms-3 space-y-wilms-2 text-small text-text-muted">
          {data.recentExports.map((entry) => (
            <li key={entry.id}>{entry.label}</li>
          ))}
        </ul>
      </DetailSidebarCard>

      <DetailSidebarCard title="Report History">
        <p className="mt-wilms-3 text-small text-text-muted">
          Last compliance export generated{' '}
          {formatDisplayDate(data.lastComplianceExport.exportedAt.slice(0, 10))} at{' '}
          {new Date(data.lastComplianceExport.exportedAt).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC',
            timeZoneName: 'short',
          })}{' '}
          by {data.lastComplianceExport.exportedBy}.
        </p>
      </DetailSidebarCard>

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
