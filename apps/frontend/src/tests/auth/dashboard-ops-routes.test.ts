import { describe, expect, it } from 'vitest';
import { USER_ROLE } from '@/constants/roles';
import { SUPER_ADMIN_NAV, SHELL_NAV_GROUP_LABELS } from '@/constants/navigation';
import { canRoleAccessPath } from '@/lib/auth/routes';
import { resolveShellBreadcrumbs } from '@/utils/shell-breadcrumbs';
import { resolveShellPageTitle } from '@/utils/shell-page-title';
import { SEARCH_NAVIGATION_DESTINATIONS } from '@/constants/search-navigation';

describe('Dashboard vs Operations routes', () => {
  it('keeps /dashboard and /ops as distinct Super Admin destinations', () => {
    const dashboard = SUPER_ADMIN_NAV.find((item) => item.href === '/dashboard');
    const ops = SUPER_ADMIN_NAV.find((item) => item.href === '/ops');

    expect(dashboard).toBeTruthy();
    expect(ops).toBeTruthy();
    expect(dashboard!.href).not.toBe(ops!.href);
    expect(dashboard!.group).toBe('overview');
    expect(ops!.group).toBe('system');
    expect(SHELL_NAV_GROUP_LABELS.operations).toBe('Daily Operations');
  });

  it('allows Super Admin access to both routes without collapsing to one path', () => {
    expect(canRoleAccessPath(USER_ROLE.SUPER_ADMIN, '/dashboard', 'user-super-admin')).toBe(true);
    expect(canRoleAccessPath(USER_ROLE.SUPER_ADMIN, '/ops', 'user-super-admin')).toBe(true);
    expect(canRoleAccessPath(USER_ROLE.COLLECTOR, '/ops', 'user-collector')).toBe(false);
  });

  it('resolves distinct titles and breadcrumbs', () => {
    expect(resolveShellPageTitle('/dashboard')).toBe('Dashboard');
    expect(resolveShellPageTitle('/ops')).toBe('Operations');

    const dashboardCrumbs = resolveShellBreadcrumbs('/dashboard').map((item) => item.label);
    const opsCrumbs = resolveShellBreadcrumbs('/ops').map((item) => item.label);

    expect(dashboardCrumbs).toContain('Dashboard');
    expect(opsCrumbs).toContain('Operations');
    expect(opsCrumbs).toContain('System Health');
    expect(dashboardCrumbs.join('>')).not.toBe(opsCrumbs.join('>'));
  });

  it('exposes both destinations in command-palette navigation', () => {
    const hrefs = SEARCH_NAVIGATION_DESTINATIONS.map((item) => item.href);
    expect(hrefs).toContain('/dashboard');
    expect(hrefs).toContain('/ops');
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
