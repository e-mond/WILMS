import Link from 'next/link';
import { DASHBOARD_GROUP_RISK_TONE_CLASS } from '@/constants/dashboard-display';
import { GROUP_RISK_LEVEL } from '@/types/group';
import type { DashboardGroupRiskSegment } from '@/types/dashboard';

const RISK_FILTER_BY_TONE: Record<DashboardGroupRiskSegment['tone'], string> = {
  low: GROUP_RISK_LEVEL.LOW_RISK,
  atRisk: GROUP_RISK_LEVEL.AT_RISK,
  flagged: GROUP_RISK_LEVEL.FLAGGED,
  suspended: GROUP_RISK_LEVEL.SUSPENDED,
};

export interface GroupRiskCardProps {
  segments: DashboardGroupRiskSegment[];
  totalGroups: number;
  compact?: boolean;
}

export function GroupRiskCard({ segments, totalGroups, compact = false }: GroupRiskCardProps) {
  const gradientStops = segments.reduce<string[]>((stops, segment, index) => {
    const previousPercent = segments
      .slice(0, index)
      .reduce((total, entry) => total + entry.percent, 0);
    const cssVar =
      segment.tone === 'low'
        ? 'var(--color-status-active)'
        : segment.tone === 'atRisk'
          ? 'var(--color-status-at-risk)'
          : segment.tone === 'flagged'
            ? 'var(--color-danger)'
            : 'var(--color-status-blacklisted)';

    if (segment.percent > 0) {
      stops.push(`${cssVar} ${previousPercent}% ${previousPercent + segment.percent}%`);
    }

    return stops;
  }, []);

  return (
    <section className={compact ? 'min-w-0 rounded-sm border border-border bg-card p-wilms-3' : 'min-w-0 rounded-sm border border-border bg-card p-wilms-4'}>
      <h2 className={compact ? 'text-body font-semibold text-text-primary' : 'text-heading-2 font-semibold text-text-primary'}>
        Group Risk Distribution
      </h2>
      <div className={compact ? 'mt-wilms-3 flex items-center gap-wilms-3' : 'mt-wilms-4 flex flex-col items-center gap-wilms-4 md:flex-row md:items-start'}>
        <div
          className={
            compact
              ? 'relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-[5px] border-border'
              : 'relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-[6px] border-border sm:h-32 sm:w-32 sm:border-8 md:h-36 md:w-36'
          }
          style={{
            background:
              gradientStops.length > 0
                ? `conic-gradient(${gradientStops.join(', ')})`
                : 'var(--color-border)',
          }}
          role="img"
          aria-label="Group risk distribution chart"
        >
          <div className={compact ? 'flex h-12 w-12 flex-col items-center justify-center rounded-full bg-card text-center' : 'flex h-16 w-16 flex-col items-center justify-center rounded-full bg-card text-center sm:h-[4.5rem] sm:w-[4.5rem] md:h-20 md:w-20'}>
            <p className={compact ? 'text-body font-bold text-text-primary' : 'text-heading-3 font-bold text-text-primary'}>{totalGroups}</p>
            {!compact ? (
              <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted sm:text-small">
                GROUPS
              </p>
            ) : null}
          </div>
        </div>
        <ul className={compact ? 'grid min-w-0 flex-1 gap-wilms-1' : 'grid w-full min-w-0 gap-wilms-2 sm:grid-cols-2 md:flex-1 md:grid-cols-1'}>
          {segments.map((segment) => (
            <li
              key={segment.label}
              className="flex min-w-0 items-center gap-wilms-2 text-small"
            >
              <span
                className={`h-3 w-3 shrink-0 rounded-sm ${DASHBOARD_GROUP_RISK_TONE_CLASS[segment.tone]}`}
                aria-hidden="true"
              />
              <Link
                href={`/groups?risk=${RISK_FILTER_BY_TONE[segment.tone]}`}
                className="min-w-0 flex-1 truncate text-text-primary hover:text-brand-primary hover:underline"
              >
                {segment.label}
              </Link>
              <span className="shrink-0 font-semibold text-text-muted">
                {segment.count} ({segment.percent}%)
              </span>
            </li>
          ))}
        </ul>
      </div>
      {!compact ? (
        <Link
          href="/groups"
          className="mt-wilms-4 inline-block text-small font-semibold text-brand-primary hover:underline"
        >
          View all groups
        </Link>
      ) : null}
    </section>
  );
}
