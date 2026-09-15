import { cn } from '@/utils/cn';

export interface WilmsBrandMarkProps {
  className?: string;
  compact?: boolean;
  roleLabel?: string;
}

export function WilmsBrandMark({
  className,
  compact = false,
  roleLabel = 'WILMS',
}: WilmsBrandMarkProps) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-xl bg-brand-primary font-bold text-card shadow-xs',
          'ring-1 ring-brand-primary/20',
          compact ? 'h-9 w-9 text-small' : 'h-10 w-10 text-body',
        )}
        aria-hidden="true"
      >
        W
      </span>
      {!compact ? (
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold tracking-wide text-brand-primary">WILMS</p>
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
            {roleLabel}
          </p>
        </div>
      ) : null}
    </div>
  );
}
