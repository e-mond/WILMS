import {
  COLLECTOR_PAYMENT_STATUS,
  type CollectorPaymentStatus,
} from '@/types/collector-dashboard';
import type { BadgeVariant } from '@/components/ui/Badge';

export const COLLECTOR_PAYMENT_STATUS_DISPLAY: Record<
  CollectorPaymentStatus,
  { label: string; variant: BadgeVariant }
> = {
  [COLLECTOR_PAYMENT_STATUS.COLLECTED]: { label: 'Collected', variant: 'success' },
  [COLLECTOR_PAYMENT_STATUS.PENDING]: { label: 'Pending', variant: 'pending' },
  [COLLECTOR_PAYMENT_STATUS.MISSED]: { label: 'Missed', variant: 'danger' },
};
