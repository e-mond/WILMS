import { describe, expect, it } from 'vitest';
import { resolveShellBreadcrumbs } from '@/utils/shell-breadcrumbs';

describe('resolveShellBreadcrumbs', () => {
  it('returns home/dashboard crumbs on super admin dashboard', () => {
    expect(resolveShellBreadcrumbs('/dashboard')).toEqual([
      { label: 'Home', href: '/dashboard' },
      { label: 'Dashboard' },
    ]);
  });

  it('returns nested operations crumbs for reassignment control centre', () => {
    expect(resolveShellBreadcrumbs('/ops/reassignment')).toEqual([
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Operations', href: '/ops' },
      { label: 'Reassignment' },
    ]);
  });

  it('returns a single Field crumb on collector dashboard', () => {
    expect(resolveShellBreadcrumbs('/collector/dashboard')).toEqual([{ label: 'Field' }]);
  });

  it('adds nested parents for report detail routes', () => {
    expect(resolveShellBreadcrumbs('/reports/audit-log')).toEqual([
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Reports', href: '/reports' },
      { label: 'Audit Log Report' },
    ]);
  });

  it('uses Field parent for collector sub-routes without a double Dashboard crumb', () => {
    expect(resolveShellBreadcrumbs('/collector/security')).toEqual([
      { label: 'Field', href: '/collector/dashboard' },
      { label: 'Device Security' },
    ]);
    expect(resolveShellBreadcrumbs('/collector/expenses')).toEqual([
      { label: 'Field', href: '/collector/dashboard' },
      { label: 'Expenses' },
    ]);
    expect(resolveShellBreadcrumbs('/collector/settings')).toEqual([
      { label: 'Field', href: '/collector/dashboard' },
      { label: 'Settings' },
    ]);
  });

  it('returns dashboard and collectors crumbs on collectors management', () => {
    expect(resolveShellBreadcrumbs('/collectors')).toEqual([
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Collectors' },
    ]);
  });

  it('labels borrowers, applications, records, and update requests', () => {
    expect(resolveShellBreadcrumbs('/borrowers').map((item) => item.label)).toEqual([
      'Dashboard',
      'Borrowers',
    ]);
    expect(resolveShellBreadcrumbs('/borrowers', 'status=PENDING').map((item) => item.label)).toEqual([
      'Dashboard',
      'Applications',
    ]);
    expect(resolveShellBreadcrumbs('/records').map((item) => item.label)).toEqual([
      'Dashboard',
      'Borrower Records',
    ]);
    expect(resolveShellBreadcrumbs('/borrower-updates').map((item) => item.label)).toEqual([
      'Dashboard',
      'Requests',
    ]);
  });
});
