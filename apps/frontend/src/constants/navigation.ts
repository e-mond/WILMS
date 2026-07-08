export type ShellNavIcon =
  | 'dashboard'
  | 'borrowers'
  | 'loans'
  | 'applications'
  | 'disbursements'
  | 'collections'
  | 'collectors'
  | 'groups'
  | 'risk'
  | 'audit'
  | 'reports'
  | 'adjustments'
  | 'settings'
  | 'admin-fee'
  | 'reconcile'
  | 'register'
  | 'queue'
  | 'reviewed';

export interface ShellNavItem {
  href: string;
  label: string;
  exact?: boolean;
  icon?: ShellNavIcon;
}

export const SUPER_ADMIN_NAV: ShellNavItem[] = [
  { href: '/dashboard', label: 'Dashboard', exact: true, icon: 'dashboard' },
  { href: '/borrowers', label: 'Borrowers', icon: 'borrowers' },
  { href: '/loan-pools', label: 'Loan Pools', icon: 'loans' },
  { href: '/borrowers?status=PENDING', label: 'Applications', icon: 'applications' },
  { href: '/loans', label: 'Disbursements', icon: 'disbursements' },
  { href: '/reports/daily-collection', label: 'Collections', icon: 'collections' },
  { href: '/collectors', label: 'Collectors', icon: 'collectors' },
  { href: '/groups', label: 'Groups', icon: 'groups' },
  { href: '/risk-flags', label: 'Risk & Flags', icon: 'risk' },
  { href: '/communication-center', label: 'Communication Center', icon: 'reports' },
  { href: '/reports/audit-log', label: 'Audit Log', exact: true, icon: 'audit' },
  { href: '/reports', label: 'Reports', exact: true, icon: 'reports' },
  { href: '/settings', label: 'Settings', exact: true, icon: 'settings' },
];

export const COLLECTOR_NAV: ShellNavItem[] = [
  { href: '/collector/dashboard', label: 'Dashboard', exact: true, icon: 'dashboard' },
  { href: '/collector/admin-fee', label: 'Collector Fees', icon: 'admin-fee' },
  { href: '/collector/my-borrowers', label: 'Borrowers', icon: 'borrowers' },
  { href: '/collector/expenses', label: 'Expenses', icon: 'reports' },
  { href: '/collector/reconciliation', label: 'Reconcile', icon: 'reconcile' },
  { href: '/collector/settings', label: 'Settings', icon: 'settings' },
];

export const REGISTRATION_OFFICER_NAV: ShellNavItem[] = [
  { href: '/officer/register', label: 'Register Borrower', exact: true, icon: 'register' },
  { href: '/officer/my-registrations', label: 'My Registrations', icon: 'borrowers' },
  { href: '/officer/settings', label: 'Settings', icon: 'settings' },
];

export const APPROVER_NAV: ShellNavItem[] = [
  { href: '/approver/pending', label: 'Pending Queue', exact: true, icon: 'queue' },
  { href: '/approver/sync-conflicts', label: 'Offline Sync', icon: 'queue' },
  { href: '/approver/reviewed', label: 'Reviewed', icon: 'reviewed' },
  { href: '/approver/settings', label: 'Settings', icon: 'settings' },
];

export const AUDITOR_NAV: ShellNavItem[] = [
  { href: '/auditor/reports', label: 'Reports', exact: true, icon: 'reports' },
  { href: '/auditor/audit-log', label: 'Audit Log', icon: 'audit' },
  { href: '/auditor/settings', label: 'Settings', icon: 'settings' },
];
