import { cn } from '@/utils/cn';

export interface CurrencyAmountProps {
  value: number;
  className?: string;
}

export function CurrencyAmount({ value, className }: CurrencyAmountProps) {
  const formatted = new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
  }).format(value / 100);

  return (
    <span className={cn('font-mono text-mono text-text-primary', className)}>{formatted}</span>
  );
}
