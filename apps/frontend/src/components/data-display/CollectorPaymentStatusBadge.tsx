import { Badge } from '@/components/ui/Badge';
import { COLLECTOR_PAYMENT_STATUS_DISPLAY } from '@/constants/collector-payment-status';
import type { CollectorPaymentStatus } from '@/types/collector-dashboard';

export interface CollectorPaymentStatusBadgeProps {
  status: CollectorPaymentStatus;
}

export function CollectorPaymentStatusBadge({ status }: CollectorPaymentStatusBadgeProps) {
  const display = COLLECTOR_PAYMENT_STATUS_DISPLAY[status];

  return <Badge variant={display.variant}>{display.label}</Badge>;
}
