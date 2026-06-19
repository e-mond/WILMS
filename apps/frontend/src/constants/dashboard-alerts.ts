import type {
  DashboardAlertCategory,
  DashboardAlertIcon,
  DashboardAlertSeverity,
} from '@/types/dashboard';

export interface DashboardAlertCategoryMeta {
  category: DashboardAlertCategory;
  defaultSeverity: DashboardAlertSeverity;
  icon: DashboardAlertIcon;
  defaultHref?: string;
}

export const DASHBOARD_ALERT_CATEGORY_META: Record<
  DashboardAlertCategory,
  DashboardAlertCategoryMeta
> = {
  MISSED_PAYMENT: {
    category: 'MISSED_PAYMENT',
    defaultSeverity: 'danger',
    icon: 'danger',
    defaultHref: '/reports/defaulters',
  },
  RECONCILIATION_VARIANCE: {
    category: 'RECONCILIATION_VARIANCE',
    defaultSeverity: 'warning',
    icon: 'warning',
    defaultHref: '/reports/daily-collection',
  },
  LOAN_APPROVED: {
    category: 'LOAN_APPROVED',
    defaultSeverity: 'info',
    icon: 'info',
    defaultHref: '/loans',
  },
  LOAN_REJECTED: {
    category: 'LOAN_REJECTED',
    defaultSeverity: 'warning',
    icon: 'warning',
    defaultHref: '/borrowers?status=PENDING',
  },
  DUPLICATE_REGISTRATION_BLOCKED: {
    category: 'DUPLICATE_REGISTRATION_BLOCKED',
    defaultSeverity: 'warning',
    icon: 'warning',
    defaultHref: '/borrowers',
  },
  POOL_REPLENISHED: {
    category: 'POOL_REPLENISHED',
    defaultSeverity: 'info',
    icon: 'info',
    defaultHref: '/loan-pools',
  },
  BORROWER_BLACKLISTED: {
    category: 'BORROWER_BLACKLISTED',
    defaultSeverity: 'danger',
    icon: 'danger',
    defaultHref: '/risk-flags',
  },
  COLLECTOR_BELOW_THRESHOLD: {
    category: 'COLLECTOR_BELOW_THRESHOLD',
    defaultSeverity: 'warning',
    icon: 'warning',
    defaultHref: '/collectors',
  },
  GROUP_ESCALATED: {
    category: 'GROUP_ESCALATED',
    defaultSeverity: 'warning',
    icon: 'warning',
    defaultHref: '/groups',
  },
  RISK_FLAG_TRIGGERED: {
    category: 'RISK_FLAG_TRIGGERED',
    defaultSeverity: 'danger',
    icon: 'danger',
    defaultHref: '/risk-flags',
  },
  AUDIT_WARNING: {
    category: 'AUDIT_WARNING',
    defaultSeverity: 'warning',
    icon: 'warning',
    defaultHref: '/reports/audit-log',
  },
  SAME_DAY_EDIT_WARNING: {
    category: 'SAME_DAY_EDIT_WARNING',
    defaultSeverity: 'info',
    icon: 'edit',
    defaultHref: '/reports/audit-log',
  },
};

export const DASHBOARD_ALERT_ICON_CLASS: Record<DashboardAlertIcon, string> = {
  danger: 'text-danger',
  warning: 'text-status-at-risk',
  info: 'text-status-info',
  edit: 'text-brand-primary',
};
