import { Badge } from '@/components/ui/Badge';
import { BORROWER_STATUS_DISPLAY } from '@/constants/borrower-status';
import type { BorrowerStatus } from '@/types/borrower';

export interface StatusBadgeProps {
  status: BorrowerStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const display = BORROWER_STATUS_DISPLAY[status] ?? {
    label: status ?? 'Unknown',
    variant: 'muted' as const,
  };

  return (
    <Badge variant={display.variant} className={className}>
      {display.label}
    </Badge>
  );
}
