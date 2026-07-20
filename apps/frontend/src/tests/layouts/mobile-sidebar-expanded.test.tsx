import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

describe('mobile sidebar with desktop collapsed preference', () => {
  beforeEach(() => {
    useThemeStore.setState({ mode: THEME_MODE.LIGHT, isHydrated: true });
    useUiStore.setState({ toasts: [], isMobileNavOpen: false, isAsideDrawerOpen: false });
    useShellLayoutStore.setState({ isSidebarCollapsed: true, isHydrated: true });
    localStorage.removeItem('wilms-executive-default-dark-applied');
  });

  it('opens an expanded mobile drawer even when desktop sidebar is collapsed', async () => {
    const user = userEvent.setup();
    renderShell(
      <SuperAdminShell>
        <div>Content</div>
      </SuperAdminShell>,
    );

    const openButtons = screen.getAllByRole('button', { name: 'Open navigation menu' });
    await user.click(openButtons[openButtons.length - 1]!);

    const drawer = screen.getByRole('dialog', { name: 'Super Admin navigation' });
    expect(drawer.querySelector('[data-mobile-nav-drawer="true"]')).toBeTruthy();
    expect(within(drawer).queryByRole('button', { name: /Expand sidebar|Collapse sidebar/ })).toBeNull();
    expect(within(drawer).getByRole('link', { name: 'Dashboard' })).toBeVisible();
    expect(within(drawer).getByRole('button', { name: 'Log out' })).toBeVisible();
  });

  it('exposes a header menu trigger on the office mobile bar', () => {
    renderShell(
      <SuperAdminShell>
        <div>Content</div>
      </SuperAdminShell>,
    );

    const openButtons = screen.getAllByRole('button', { name: 'Open navigation menu' });
    expect(openButtons.length).toBeGreaterThanOrEqual(2);
  });
});
