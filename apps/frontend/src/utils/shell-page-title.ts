const EXACT_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/ops': 'Operations',
  '/borrowers': 'Borrowers',
  '/loan-pools': 'Loan Pools',
  '/loans': 'Loans',
  '/loans/new': 'Create Loan',
  '/collectors': 'Collectors',
  '/groups': 'Groups',
  '/risk-flags': 'Risk & Flags',
  '/expenses': 'Expense Management',
  '/communication-center': 'Communication Center',
  '/adjustments': 'Adjustments',
  '/settings': 'System Settings',
  '/reports': 'Reports',
  '/auditor/reports': 'Reports',
  '/auditor/audit-log': 'Audit Log',
  '/reports/loan-portfolio': 'Loan Portfolio Report',
  '/reports/daily-collection': 'Daily Collection Report',
  '/reports/defaulters': 'Defaulter Report',
  '/reports/collector-performance': 'Collector Performance Report',
  '/reports/group-risk': 'Group Risk Report',
  '/reports/financial-ledger': 'Financial Ledger Report',
  '/reports/audit-log': 'Audit Log Report',
  '/officer/register': 'Borrower Registration',
  '/officer/my-registrations': 'My Registrations',
  '/approver/pending': 'Pending Applications',
  '/approver/reviewed': 'Reviewed Applications',
  '/collector/dashboard': 'Collector Dashboard',
  '/collector/my-borrowers': 'My Borrowers',
  '/collector/admin-fee': 'Collector Fees',
  '/collector/reconciliation': 'Daily Reconciliation',
  '/collector/security': 'Device Security',
};

const PREFIX_TITLES: Array<{ test: (pathname: string) => boolean; title: string }> = [
  {
    test: (pathname) => pathname.includes('/borrowers/') && pathname.endsWith('/loan'),
    title: 'Loan Detail',
  },
  { test: (pathname) => pathname.startsWith('/borrowers/'), title: 'Borrower Profile' },
  { test: (pathname) => pathname.startsWith('/loans/'), title: 'Loan Detail' },
  { test: (pathname) => pathname.startsWith('/collectors/'), title: 'Collector Profile' },
  { test: (pathname) => pathname.startsWith('/groups/'), title: 'Group Profile' },
  { test: (pathname) => pathname.startsWith('/approver/pending/'), title: 'Application Review' },
  { test: (pathname) => pathname.startsWith('/collector/payment/'), title: 'Record Payment' },
  {
    test: (pathname) =>
      pathname.startsWith('/collector/admin-fee/') && pathname !== '/collector/admin-fee',
    title: 'Record Admin Fee',
  },
];

export function resolveShellPageTitle(pathname: string): string {
  if (EXACT_TITLES[pathname]) {
    return EXACT_TITLES[pathname];
  }

  for (const entry of PREFIX_TITLES) {
    if (entry.test(pathname)) {
      return entry.title;
    }
  }

  return 'WILMS';
}
