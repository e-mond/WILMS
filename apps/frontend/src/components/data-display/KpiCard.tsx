import type { ReactNode } from 'react';
import { DASHBOARD_TREND_TONE_CLASS } from '@/constants/dashboard-display';
import type { DashboardValueTone } from '@/types/dashboard';
import { cn } from '@/utils/cn';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

export interface KpiCardProps {
  label: string;
  value: ReactNode;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  trendTone?: DashboardValueTone;
  valueClassName?: string;
  icon?: ReactNode;
  variant?: 'default' | 'executive';
  className?: string;
  /** Soft loading skeleton for value area (label remains visible). */
  isLoading?: boolean;
  sparkline?: ReactNode;
}

export function KpiCard({
  label,
  value,
  trend,
  trendDirection = 'neutral',
  trendTone,
  valueClassName,
  icon,
  variant = 'default',
  className,
  isLoading = false,
  sparkline,
}: KpiCardProps) {
  const resolvedTrendTone: DashboardValueTone =
    trendTone ??
    (trendDirection === 'up' ? 'success' : trendDirection === 'down' ? 'danger' : 'default');

  const isExecutive = variant === 'executive';
  const TrendIcon =
    trendDirection === 'up' ? TrendingUp : trendDirection === 'down' ? TrendingDown : Minus;

  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] border border-border/80 bg-card shadow-[var(--shadow-card)] motion-card-lift',
        isExecutive ? 'flex flex-col justify-between' : null,
        'p-[var(--density-kpi-padding)]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-wilms-3">
        <p
          className={cn(
            'font-semibold text-text-muted',
            isExecutive ? 'text-small uppercase tracking-wide' : 'text-small',
          )}
        >
          {label}
        </p>
        {icon ? (
          <span
            className="rounded-md bg-background p-1.5 text-text-muted"
            aria-hidden="true"
          >
            {icon}
          </span>
        ) : null}
      </div>
      {isLoading ? (
        <div
          className="mt-wilms-2 h-8 w-24 animate-pulse rounded-sm skeleton-shimmer"
          aria-hidden="true"
        />
      ) : (
        <div
          className={cn(
            'mt-wilms-2 font-mono font-semibold tabular-nums tracking-tight text-heading-2',
            isExecutive && 'text-heading-1',
            valueClassName,
          )}
        >
          {value}
        </div>
      )}
      {sparkline ? <div className="mt-wilms-2">{sparkline}</div> : null}
      {trend ? (
        <p
          className={cn(
            'mt-wilms-2 flex items-center gap-wilms-1 text-small font-semibold',
            DASHBOARD_TREND_TONE_CLASS[resolvedTrendTone],
          )}
        >
          <TrendIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{trend}</span>
        </p>
      ) : null}
    </div>
  );
}
