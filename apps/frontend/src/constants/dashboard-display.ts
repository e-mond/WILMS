import type {
  DashboardBorrowerTone,
  DashboardGroupRiskTone,
  DashboardValueTone,
} from '@/types/dashboard';

export const DASHBOARD_VALUE_TONE_CLASS: Record<DashboardValueTone, string> = {
  gold: 'text-brand-primary',
  success: 'text-status-active',
  danger: 'text-danger',
  default: 'text-text-primary',
};

export const DASHBOARD_TREND_TONE_CLASS: Record<DashboardValueTone, string> = {
  gold: 'text-brand-primary',
  success: 'text-status-active',
  danger: 'text-danger',
  default: 'text-text-muted',
};

export const DASHBOARD_BORROWER_TONE_CLASS: Record<
  DashboardBorrowerTone,
  { bar: string; text: string }
> = {
  active: { bar: 'bg-status-active', text: 'text-status-active' },
  atRisk: { bar: 'bg-status-at-risk', text: 'text-status-at-risk' },
  defaulted: { bar: 'bg-danger', text: 'text-danger' },
  blacklisted: { bar: 'bg-status-blacklisted', text: 'text-status-blacklisted' },
  pending: { bar: 'bg-status-pending', text: 'text-status-pending' },
};

export const DASHBOARD_GROUP_RISK_TONE_CLASS: Record<DashboardGroupRiskTone, string> = {
  low: 'bg-status-active',
  atRisk: 'bg-status-at-risk',
  flagged: 'bg-danger',
  suspended: 'bg-status-blacklisted',
};
