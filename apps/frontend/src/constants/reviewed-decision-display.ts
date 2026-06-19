import type { ReviewedDecision } from '@/types/approval';

export const REVIEWED_DECISION_LABELS: Record<ReviewedDecision, string> = {
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  BLACKLISTED: 'Blacklisted',
};

export const REVIEWED_DECISION_BADGE_CLASS: Record<ReviewedDecision, string> = {
  APPROVED: 'bg-status-active-light text-status-active',
  REJECTED: 'bg-warning-light text-warning',
  BLACKLISTED: 'bg-status-blacklisted-light text-status-blacklisted',
};
