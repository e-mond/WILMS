import { resolveShellPageTitle } from '@/utils/shell-page-title';

export interface ShellBreadcrumbItem {
  label: string;
  href?: string;
}

const NESTED_BREADCRUMB_PARENTS: Array<{
  test: (pathname: string) => boolean;
  parent: ShellBreadcrumbItem;
}> = [
  {
    test: (pathname) => pathname.startsWith('/reports/') && pathname !== '/reports',
    parent: { label: 'Reports', href: '/reports' },
  },
  {
    test: (pathname) => pathname.startsWith('/groups/'),
    parent: { label: 'Groups', href: '/groups' },
  },
  {
    test: (pathname) => pathname.startsWith('/collectors/'),
    parent: { label: 'Collectors', href: '/collectors' },
  },
  {
    test: (pathname) => pathname.startsWith('/borrowers/'),
    parent: { label: 'Borrowers', href: '/borrowers' },
  },
  {
    test: (pathname) => pathname.startsWith('/loans/'),
    parent: { label: 'Loans', href: '/loans' },
  },
  {
    test: (pathname) => pathname.startsWith('/officer/'),
    parent: { label: 'Intake', href: '/officer/my-registrations' },
  },
  {
    test: (pathname) => pathname.startsWith('/approver/'),
    parent: { label: 'Approvals', href: '/approver/pending' },
  },
  {
    test: (pathname) => pathname.startsWith('/collector/') && pathname !== '/collector/dashboard',
    parent: { label: 'Dashboard', href: '/collector/dashboard' },
  },
];

export function resolveShellBreadcrumbs(pathname: string): ShellBreadcrumbItem[] {
  if (pathname === '/dashboard') {
    return [
      { label: 'Home', href: '/dashboard' },
      { label: 'Dashboard' },
    ];
  }

  if (pathname === '/ops') {
    return [
      { label: 'Home', href: '/dashboard' },
      { label: 'Operations', href: '/ops' },
      { label: 'System Health' },
    ];
  }

  if (pathname === '/collector/dashboard') {
    return [{ label: 'Dashboard' }];
  }

  const nestedParent = NESTED_BREADCRUMB_PARENTS.find((entry) => entry.test(pathname));

  if (nestedParent) {
    return [
      { label: 'Dashboard', href: '/dashboard' },
      nestedParent.parent,
      { label: resolveShellPageTitle(pathname) },
    ];
  }

  return [
    { label: 'Dashboard', href: '/dashboard' },
    { label: resolveShellPageTitle(pathname) },
  ];
}
