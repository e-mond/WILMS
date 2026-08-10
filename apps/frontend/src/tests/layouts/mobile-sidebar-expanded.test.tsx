import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SuperAdminShell } from '@/layouts/SuperAdminShell';
import { PermissionProvider } from '@/components/providers/PermissionProvider';
import { TestQueryProvider } from '@/tests/utils/test-query-client';
import { useShellLayoutStore } from '@/state/shellLayoutStore';
import { useUiStore } from '@/state/uiStore';
import { useThemeStore } from '@/state/themeStore';
import { THEME_MODE } from '@/constants/theme';
import { USER_ROLE } from '@/constants/roles';

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', role: USER_ROLE.SUPER_ADMIN, displayName: 'Test User' },
    isAuthenticated: true,
    isHydrated: true,
    isExpired: false,
    clearSession: vi.fn(),
  }),
}));

function renderShell(ui: ReactNode) {
  return render(
    <TestQueryProvider>
      <PermissionProvider>{ui}</PermissionProvider>
    </TestQueryProvider>,
  );
}

describe('super admin mobile navigation without hamburger drawer', () => {
  beforeEach(() => {
    useThemeStore.setState({ mode: THEME_MODE.LIGHT, isHydrated: true });
    useUiStore.setState({ toasts: [], isMobileNavOpen: false, isAsideDrawerOpen: false });
    useShellLayoutStore.setState({ isSidebarCollapsed: true, isHydrated: true });
    localStorage.removeItem('wilms-executive-default-dark-applied');
  });

  it('does not expose a hamburger navigation trigger', () => {
    renderShell(
      <SuperAdminShell>
        <div>Content</div>
      </SuperAdminShell>,
    );

    expect(screen.queryByRole('button', { name: 'Open navigation menu' })).not.toBeInTheDocument();
    expect(
      screen.getAllByRole('navigation', { name: 'Super Admin bottom navigation' }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByRole('link', { name: 'Dashboard' }).some((link) =>
        link.getAttribute('href') === '/dashboard',
      ),
    ).toBe(true);
  });
});
