import { cn } from '@/utils/cn';
import { CurrencyAmount } from '@/components/data-display/CurrencyAmount';

export interface VarianceAmountProps {
  value: number;
  className?: string;
}

export function VarianceAmount({ value, className }: VarianceAmountProps) {
  if (value === 0) {
    return <CurrencyAmount value={0} className={cn('text-status-active', className)} />;
  }

  const sign = value > 0 ? '+' : '-';
  const tone = value > 0 ? 'text-status-active' : 'text-danger';

  return (
    <span className={cn('inline-flex items-center gap-wilms-1 font-mono text-mono', tone, className)}>
      <span aria-hidden="true">{sign}</span>
      <CurrencyAmount value={Math.abs(value)} />
    </span>
  );
}
