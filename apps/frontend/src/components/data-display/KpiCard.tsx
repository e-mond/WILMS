import type { ReactNode } from 'react';
import { DASHBOARD_TREND_TONE_CLASS } from '@/constants/dashboard-display';
import type { DashboardValueTone } from '@/types/dashboard';
import { cn } from '@/utils/cn';

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
}: KpiCardProps) {
  const resolvedTrendTone: DashboardValueTone =
    trendTone ??
    (trendDirection === 'up' ? 'success' : trendDirection === 'down' ? 'danger' : 'default');

  const isExecutive = variant === 'executive';
  const trendArrow =
    trendDirection === 'up' ? '↑' : trendDirection === 'down' ? '↓' : null;

  return (
    <div
      className={cn(
        'rounded-sm border border-border bg-card p-wilms-4',
        isExecutive && 'flex flex-col justify-between',
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
          <span className="text-text-muted" aria-hidden="true">
            {icon}
          </span>
        ) : null}
      </div>
      <div
        className={cn(
          'mt-wilms-2 font-mono font-bold',
          isExecutive ? 'text-display' : 'text-display',
          valueClassName,
        )}
      >
        {value}
      </div>
      {trend ? (
        <p
          className={cn(
            'mt-wilms-2 flex items-center gap-wilms-1 text-small font-semibold',
            DASHBOARD_TREND_TONE_CLASS[resolvedTrendTone],
          )}
        >
          {trendArrow ? <span aria-hidden="true">{trendArrow}</span> : null}
          <span>{trend}</span>
        </p>
      ) : null}
    </div>
  );
}
