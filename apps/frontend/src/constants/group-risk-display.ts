import { GROUP_RISK_LEVEL, type GroupRiskLevel } from '@/types/group';
import type { BadgeProps } from '@/components/ui/Badge';

export const GROUP_RISK_DISPLAY: Record<
  GroupRiskLevel,
  { label: string; variant: BadgeProps['variant']; barClass: string; textClass: string }
> = {
  [GROUP_RISK_LEVEL.LOW_RISK]: {
    label: 'Low Risk',
    variant: 'success',
    barClass: 'bg-status-active',
    textClass: 'text-status-active',
  },
  [GROUP_RISK_LEVEL.AT_RISK]: {
    label: 'At Risk',
    variant: 'warning',
    barClass: 'bg-status-at-risk',
    textClass: 'text-status-at-risk',
  },
  [GROUP_RISK_LEVEL.FLAGGED]: {
    label: 'Flagged',
    variant: 'danger',
    barClass: 'bg-danger',
    textClass: 'text-danger',
  },
  [GROUP_RISK_LEVEL.SUSPENDED]: {
    label: 'Suspended',
    variant: 'blacklisted',
    barClass: 'bg-status-blacklisted',
    textClass: 'text-status-blacklisted',
  },
};
