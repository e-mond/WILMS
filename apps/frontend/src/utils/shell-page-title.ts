const EXACT_TITLES: Record<string, string> = {
  '/dashboard': 'Operational Dashboard',
  '/executive': 'Executive Intelligence',
  '/ops': 'Operations',
  '/ops/reassignment': 'Reassignment',
  '/documentation': 'Documentation Centre',
  '/records': 'Borrower Records',
  '/approver/records': 'Borrower Records',
  '/officer/records': 'Borrower Records',
  '/auditor/records': 'Borrower Records',
  '/borrowers': 'Borrowers',
  '/borrower-updates': 'Requests',
  '/officer/borrower-updates': 'Requests',
  '/collector/borrower-updates': 'Requests',
  '/approver/holidays': 'Requests',
  '/collector/holidays': 'Holidays',
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
  '/reports/missed-payments': 'Missed Payments Report',
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
  '/collector/expenses': 'Expenses',
  '/collector/settings': 'Settings',
  '/collector/security': 'Device Security',
  '/collector/borrowers': 'Borrower Profile',
};

const PREFIX_TITLES: Array<{ test: (pathname: string) => boolean; title: string }> = [
  {
    test: (pathname) => pathname.includes('/borrowers/') && pathname.endsWith('/loan'),
    title: 'Loan Detail',
  },
  { test: (pathname) => pathname.startsWith('/borrowers/'), title: 'Borrower Profile' },
  { test: (pathname) => pathname.startsWith('/records/'), title: 'Borrower File' },
  { test: (pathname) => pathname.startsWith('/approver/records/'), title: 'Borrower File' },
  { test: (pathname) => pathname.startsWith('/officer/records/'), title: 'Borrower File' },
  { test: (pathname) => pathname.startsWith('/auditor/records/'), title: 'Borrower File' },
  { test: (pathname) => pathname.startsWith('/loans/'), title: 'Loan Detail' },
  { test: (pathname) => pathname.startsWith('/collectors/'), title: 'Collector Profile' },
  { test: (pathname) => pathname.startsWith('/groups/'), title: 'Group Profile' },
  { test: (pathname) => pathname.startsWith('/approver/pending/'), title: 'Application Review' },
  { test: (pathname) => pathname.startsWith('/collector/payment/'), title: 'Record Payment' },
  { test: (pathname) => pathname.startsWith('/collector/borrowers/'), title: 'Borrower Profile' },
  {
    test: (pathname) =>
      pathname.startsWith('/collector/admin-fee/') && pathname !== '/collector/admin-fee',
    title: 'Record Admin Fee',
  },
];

export function resolveShellPageTitle(pathname: string, search = ''): string {
  const query = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(query);

  if (pathname === '/borrowers' && params.get('status') === 'PENDING') {
    return 'Applications';
  }

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
