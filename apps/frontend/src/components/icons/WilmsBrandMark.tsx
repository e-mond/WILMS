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
    <div className={cn('flex items-center gap-wilms-2 min-w-0', className)}>
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-sm bg-brand-primary font-bold text-background',
          compact ? 'h-8 w-8 text-small' : 'h-9 w-9 text-body',
        )}
        aria-hidden="true"
      >
        W
      </span>
      {!compact ? (
        <div className="min-w-0">
          <p className="truncate font-bold tracking-wider text-executive-gold">WILMS</p>
          <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-text-muted">
            {roleLabel}
          </p>
        </div>
      ) : null}
    </div>
  );
}
