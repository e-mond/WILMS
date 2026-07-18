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
  | 'offline-sync'
  | 'reviewed'
  | 'expenses'
  | 'messages';

/** Progressive-disclosure categories for shell navigation. */
export type ShellNavGroupId =
  | 'overview'
  | 'operations'
  | 'financial'
  | 'people'
  | 'reports'
  | 'communication'
  | 'administration'
  | 'system';

export const SHELL_NAV_GROUP_LABELS: Record<ShellNavGroupId, string> = {
  overview: 'Overview',
  /** Lending workflow — not the /ops platform control centre. */
  operations: 'Daily Operations',
  financial: 'Financial Management',
  people: 'People & Groups',
  reports: 'Reports & Analytics',
  communication: 'Communication',
  administration: 'Administration',
  system: 'System',
};

/** Display order for grouped navigation. */
export const SHELL_NAV_GROUP_ORDER: ShellNavGroupId[] = [
  'overview',
  'operations',
  'financial',
  'people',
  'reports',
  'communication',
  'administration',
  'system',
];

export interface ShellNavItem {
  href: string;
  label: string;
  exact?: boolean;
  icon?: ShellNavIcon;
  /** Optional category for progressive disclosure in the sidebar. */
  group?: ShellNavGroupId;
}

export const SUPER_ADMIN_NAV: ShellNavItem[] = [
  { href: '/dashboard', label: 'Dashboard', exact: true, icon: 'dashboard', group: 'overview' },
  { href: '/borrowers', label: 'Borrowers', icon: 'borrowers', group: 'people' },
  { href: '/loan-pools', label: 'Loan Pools', icon: 'loans', group: 'financial' },
  {
    href: '/borrowers?status=PENDING',
    label: 'Applications',
    icon: 'applications',
    group: 'operations',
  },
  { href: '/loans', label: 'Disbursements', icon: 'disbursements', group: 'operations' },
  {
    href: '/reports/daily-collection',
    label: 'Collections',
    icon: 'collections',
    group: 'operations',
  },
  { href: '/collectors', label: 'Collectors', icon: 'collectors', group: 'people' },
  { href: '/groups', label: 'Groups', icon: 'groups', group: 'people' },
  { href: '/risk-flags', label: 'Risk & Flags', icon: 'risk', group: 'operations' },
  { href: '/expenses', label: 'Expense Management', icon: 'expenses', group: 'financial' },
  {
    href: '/communication-center',
    label: 'Communication Center',
    icon: 'reports',
    group: 'communication',
  },
  { href: '/reports/audit-log', label: 'Audit Log', exact: true, icon: 'audit', group: 'reports' },
  {
    href: '/ops',
    label: 'Operations',
    exact: true,
    icon: 'risk',
    group: 'system',
  },
  { href: '/reports', label: 'Reports', exact: true, icon: 'reports', group: 'reports' },
  { href: '/settings', label: 'Settings', exact: true, icon: 'settings', group: 'administration' },
];

export const COLLECTOR_NAV: ShellNavItem[] = [
  {
    href: '/collector/dashboard',
    label: 'Dashboard',
    exact: true,
    icon: 'dashboard',
    group: 'overview',
  },
  {
    href: '/collector/admin-fee',
    label: 'Collector Fees',
    icon: 'admin-fee',
    group: 'financial',
  },
  { href: '/collector/my-borrowers', label: 'Borrowers', icon: 'borrowers', group: 'people' },
  { href: '/collector/messages', label: 'Messages', icon: 'messages', group: 'communication' },
  { href: '/collector/expenses', label: 'Expenses', icon: 'reports', group: 'financial' },
  {
    href: '/collector/reconciliation',
    label: 'Reconcile',
    icon: 'reconcile',
    group: 'operations',
  },
  { href: '/collector/settings', label: 'Settings', icon: 'settings', group: 'administration' },
];

export const REGISTRATION_OFFICER_NAV: ShellNavItem[] = [
  {
    href: '/officer/register',
    label: 'Register Borrower',
    exact: true,
    icon: 'register',
    group: 'operations',
  },
  {
    href: '/officer/my-registrations',
    label: 'My Registrations',
    icon: 'borrowers',
    group: 'operations',
  },
  { href: '/officer/settings', label: 'Settings', icon: 'settings', group: 'administration' },
];

export const APPROVER_NAV: ShellNavItem[] = [
  {
    href: '/approver/pending',
    label: 'Pending Queue',
    exact: true,
    icon: 'queue',
    group: 'operations',
  },
  {
    href: '/approver/sync-conflicts',
    label: 'Offline Sync',
    icon: 'offline-sync',
    group: 'operations',
  },
  { href: '/approver/reviewed', label: 'Reviewed', icon: 'reviewed', group: 'operations' },
  { href: '/approver/settings', label: 'Settings', icon: 'settings', group: 'administration' },
];

export const AUDITOR_NAV: ShellNavItem[] = [
  { href: '/auditor/reports', label: 'Reports', exact: true, icon: 'reports', group: 'reports' },
  { href: '/auditor/audit-log', label: 'Audit Log', icon: 'audit', group: 'reports' },
  { href: '/auditor/settings', label: 'Settings', icon: 'settings', group: 'administration' },
];

export function groupShellNavItems(
  items: ShellNavItem[],
): Array<{ groupId: ShellNavGroupId | 'ungrouped'; label: string | null; items: ShellNavItem[] }> {
  const hasGroups = items.some((item) => item.group);
  if (!hasGroups) {
    return [{ groupId: 'ungrouped', label: null, items }];
  }

  const buckets = new Map<ShellNavGroupId | 'ungrouped', ShellNavItem[]>();
  for (const item of items) {
    const key = item.group ?? 'ungrouped';
    const list = buckets.get(key) ?? [];
    list.push(item);
    buckets.set(key, list);
  }

  const ordered: Array<{
    groupId: ShellNavGroupId | 'ungrouped';
    label: string | null;
    items: ShellNavItem[];
  }> = [];

  for (const groupId of SHELL_NAV_GROUP_ORDER) {
    const groupItems = buckets.get(groupId);
    if (groupItems?.length) {
      ordered.push({
        groupId,
        label: SHELL_NAV_GROUP_LABELS[groupId],
        items: groupItems,
      });
    }
  }

  const ungrouped = buckets.get('ungrouped');
  if (ungrouped?.length) {
    ordered.push({ groupId: 'ungrouped', label: null, items: ungrouped });
  }

  return ordered;
}
