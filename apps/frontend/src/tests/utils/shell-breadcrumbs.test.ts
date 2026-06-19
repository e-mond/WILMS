import { describe, expect, it } from 'vitest';
import { resolveShellBreadcrumbs } from '@/utils/shell-breadcrumbs';

describe('resolveShellBreadcrumbs', () => {
  it('returns home/dashboard/overview crumbs on super admin dashboard', () => {
    expect(resolveShellBreadcrumbs('/dashboard')).toEqual([
      { label: 'Home', href: '/dashboard' },
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Overview' },
    ]);
  });

  it('returns a single dashboard crumb on collector dashboard', () => {
    expect(resolveShellBreadcrumbs('/collector/dashboard')).toEqual([{ label: 'Dashboard' }]);
  });

  it('adds nested parents for report detail routes', () => {
    expect(resolveShellBreadcrumbs('/reports/audit-log')).toEqual([
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Reports', href: '/reports' },
      { label: 'Audit Log Report' },
    ]);
  });

  it('adds collector parent for field sub-routes', () => {
    expect(resolveShellBreadcrumbs('/collector/security')[2]).toEqual({
      label: 'Device Security',
    });
  });

  it('returns dashboard and collectors crumbs on collectors management', () => {
    expect(resolveShellBreadcrumbs('/collectors')).toEqual([
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Collectors' },
    ]);
  });
});
