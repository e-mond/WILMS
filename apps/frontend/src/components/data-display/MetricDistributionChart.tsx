import { cn } from '@/utils/cn';

export interface MetricDistributionItem {
  id: string;
  label: string;
  count: number;
  tone?: 'default' | 'warning' | 'danger' | 'primary' | 'blacklisted';
}

export interface MetricDistributionChartProps {
  items: MetricDistributionItem[];
  className?: string;
  'aria-label'?: string;
}

const TONE_CLASS: Record<NonNullable<MetricDistributionItem['tone']>, string> = {
  default: 'bg-brand-primary',
  warning: 'bg-status-at-risk',
  danger: 'bg-danger',
  primary: 'bg-brand-primary',
  blacklisted: 'bg-status-blacklisted',
};

export function MetricDistributionChart({
  items,
  className,
  'aria-label': ariaLabel = 'Distribution chart',
}: MetricDistributionChartProps) {
  const maxCount = Math.max(...items.map((item) => item.count), 1);

  return (
    <ul className={cn('space-y-wilms-3', className)} aria-label={ariaLabel}>
      {items.map((item) => {
        const widthPercent = Math.max(8, Math.round((item.count / maxCount) * 100));

        return (
          <li key={item.id}>
            <div className="mb-wilms-1 flex items-center justify-between gap-wilms-2 text-small">
              <span className="text-text-muted">{item.label}</span>
              <span className="font-semibold text-text-primary">{item.count}</span>
            </div>
            <div className="h-2 rounded-full bg-background">
              <div
                className={cn('h-2 rounded-full', TONE_CLASS[item.tone ?? 'default'])}
                style={{ width: `${widthPercent}%` }}
                role="presentation"
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
