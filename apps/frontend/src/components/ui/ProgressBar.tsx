import { cn } from '@/utils/cn';

export interface ProgressBarProps {
  value: number;
  max?: number;
  label: string;
  className?: string;
}

export function ProgressBar({ value, max = 100, label, className }: ProgressBarProps) {
  const clampedValue = Math.min(Math.max(value, 0), max);
  const percentage = max === 0 ? 0 : Math.round((clampedValue / max) * 100);

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-wilms-1 flex items-center justify-between text-small text-text-muted">
        <span>{label}</span>
        <span aria-hidden="true">{percentage}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        className="h-2 w-full rounded-sm border border-border bg-background"
      >
        <div
          className="h-full rounded-sm bg-brand-primary transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
