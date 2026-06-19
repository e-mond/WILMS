import { FLAG_STATUS, FLAG_TYPE, type FlagStatus, type FlagType } from '@/types/risk-flag';
import type { BadgeProps } from '@/components/ui/Badge';

export const FLAG_TYPE_DISPLAY: Record<FlagType, { label: string; variant: BadgeProps['variant'] }> =
  {
    [FLAG_TYPE.MISSED_PAYMENT]: { label: 'Missed Payment', variant: 'warning' },
    [FLAG_TYPE.DEFAULT]: { label: 'Default', variant: 'danger' },
    [FLAG_TYPE.FRAUD_SUSPICION]: { label: 'Fraud Suspicion', variant: 'primary' },
    [FLAG_TYPE.DUPLICATE_ID]: { label: 'Duplicate ID', variant: 'blacklisted' },
    [FLAG_TYPE.BLACKLISTED]: { label: 'Blacklisted', variant: 'blacklisted' },
  };

export const FLAG_STATUS_DISPLAY: Record<
  FlagStatus,
  { label: string; variant: BadgeProps['variant'] }
> = {
  [FLAG_STATUS.OPEN]: { label: 'Open', variant: 'warning' },
  [FLAG_STATUS.UNDER_REVIEW]: { label: 'Under Review', variant: 'pending' },
  [FLAG_STATUS.CRITICAL]: { label: 'Critical', variant: 'danger' },
  [FLAG_STATUS.RESOLVED]: { label: 'Resolved', variant: 'success' },
};
