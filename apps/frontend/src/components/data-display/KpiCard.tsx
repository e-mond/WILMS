import type { ReactNode } from 'react';
import type { DashboardValueTone } from '@/types/dashboard';
import { cn } from '@/utils/cn';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { resolveKpiIcon } from './resolveKpiIcon';

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
  const resolvedIcon = icon ?? resolveKpiIcon(label);

  return (
    <div
      className={cn(
        'rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-brand-primary/30 hover:shadow-sm motion-card-lift',
        isExecutive ? 'flex flex-col justify-between' : null,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-wilms-3">
        <p
          title={typeof label === 'string' ? label : undefined}
          className={cn(
            'min-w-0 flex-1 truncate font-semibold text-text-muted',
            isExecutive ? 'text-xs uppercase tracking-wider' : 'text-small',
          )}
        >
          {label}
        </p>
        <span
          className="shrink-0 rounded-xl border border-brand-primary/10 bg-brand-primary-light p-2 text-brand-primary"
          aria-hidden="true"
        >
          {resolvedIcon}
        </span>
      </div>
      {isLoading ? (
        <div
          className="mt-wilms-2 h-8 w-24 animate-pulse rounded-sm skeleton-shimmer"
          aria-hidden="true"
        />
      ) : (
        <div
          className={cn(
            'mt-wilms-2 font-mono font-bold tabular-nums tracking-tight text-heading-2 text-text-primary',
            isExecutive && 'text-heading-1',
            valueClassName,
          )}
        >
          {value}
        </div>
      )}
      {sparkline ? <div className="mt-wilms-2">{sparkline}</div> : null}
      {trend ? (
        <div className="mt-wilms-3 flex items-center">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
              resolvedTrendTone === 'success' && 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
              resolvedTrendTone === 'danger' && 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
              resolvedTrendTone === 'default' && 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
            )}
          >
            <TrendIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span>{trend}</span>
          </span>
        </div>
      ) : null}
    </div>
  );
}
