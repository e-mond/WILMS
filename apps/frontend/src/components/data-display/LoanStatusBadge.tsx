import { Badge } from '@/components/ui/Badge';
import { LOAN_STATUS_DISPLAY } from '@/constants/loan-status';
import type { LoanStatus } from '@/types/loan';
import { cn } from '@/utils/cn';

export interface LoanStatusBadgeProps {
  status: LoanStatus;
  className?: string;
}

export function LoanStatusBadge({ status, className }: LoanStatusBadgeProps) {
  const display = LOAN_STATUS_DISPLAY[status];

  return (
    <Badge variant={display.variant} className={cn(className)}>
      {display.label}
    </Badge>
  );
}
