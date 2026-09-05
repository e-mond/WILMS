import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SUPER_ADMIN_NAV } from '@/constants/navigation';
import { SuperAdminShell } from '@/layouts/SuperAdminShell';
import { CollectorShell } from '@/layouts/CollectorShell';
import { PermissionProvider } from '@/components/providers/PermissionProvider';
import { TestQueryProvider } from '@/tests/utils/test-query-client';
import { useShellLayoutStore } from '@/state/shellLayoutStore';
import { useUiStore } from '@/state/uiStore';
import { useThemeStore } from '@/state/themeStore';
import { THEME_MODE } from '@/constants/theme';
import { USER_ROLE } from '@/constants/roles';

const authState = vi.hoisted(() => ({
  role: 'SUPER_ADMIN',
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', role: authState.role, displayName: 'Test User' },
    isAuthenticated: true,
    isHydrated: true,
    isExpired: false,
    clearSession: vi.fn(),
  }),
}));

vi.mock('@/components/offline/CollectorOfflineShell', () => ({
  CollectorOfflineShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

function renderShell(ui: ReactNode) {
  return render(
    <TestQueryProvider>
      <PermissionProvider>{ui}</PermissionProvider>
    </TestQueryProvider>,
  );
}

const VIEWPORTS = [
  { width: 320, height: 800, label: '320×800' },
  { width: 360, height: 800, label: '360×800' },
  { width: 390, height: 844, label: '390×844' },
  { width: 414, height: 896, label: '414×896' },
  { width: 768, height: 1024, label: 'tablet' },
  { width: 1280, height: 800, label: 'desktop' },
  { width: 360, height: 480, label: 'short-height mobile' },
] as const;

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
  window.dispatchEvent(new Event('resize'));
}

describe('super admin mobile navigation completeness', () => {
  beforeEach(() => {
    authState.role = USER_ROLE.SUPER_ADMIN;
    useThemeStore.setState({ mode: THEME_MODE.LIGHT, isHydrated: true });
    useUiStore.setState({ toasts: [], isMobileNavOpen: false, isAsideDrawerOpen: false });
    useShellLayoutStore.setState({ isSidebarCollapsed: true, isHydrated: true });
    localStorage.removeItem('wilms-executive-default-dark-applied');
    setViewport(390, 844);
  });

  it.each(VIEWPORTS)(
    'exposes every authorised Super Admin destination in the drawer at $label',
    async ({ width, height }) => {
      setViewport(width, height);
      const user = userEvent.setup();

      renderShell(
        <SuperAdminShell>
          <div>Content</div>
        </SuperAdminShell>,
      );

      const menuButtons = screen.getAllByRole('button', { name: 'Open navigation menu' });
      await user.click(menuButtons[menuButtons.length - 1]!);

      const drawer = await screen.findByRole('dialog', { name: /Super Admin navigation/i });
      expect(drawer.querySelector('[data-mobile-nav-scroll="true"]')).not.toBeNull();

      for (const item of SUPER_ADMIN_NAV) {
        expect(within(drawer).getByRole('link', { name: item.label })).toHaveAttribute(
          'href',
          item.href,
        );
      }

      const lastItem = SUPER_ADMIN_NAV[SUPER_ADMIN_NAV.length - 1]!;
      expect(within(drawer).getByRole('link', { name: lastItem.label })).toBeInTheDocument();
      expect(within(drawer).getByRole('button', { name: 'Log out' })).toBeInTheDocument();
    },
  );

  it('opens, scrolls, navigates, and closes the mobile drawer', async () => {
    const user = userEvent.setup();
    renderShell(
      <SuperAdminShell>
        <div>Content</div>
      </SuperAdminShell>,
    );

    expect(screen.queryByRole('dialog', { name: /Super Admin navigation/i })).not.toBeInTheDocument();

    await user.click(
      screen.getAllByRole('button', { name: 'Open navigation menu' }).at(-1)!,
    );
    const drawer = await screen.findByRole('dialog', { name: /Super Admin navigation/i });
    expect(useUiStore.getState().isMobileNavOpen).toBe(true);

    const settingsLink = within(drawer).getByRole('link', { name: 'Settings' });
    await user.click(settingsLink);
    expect(useUiStore.getState().isMobileNavOpen).toBe(false);
  });

  it('does not expose Super Admin destinations to a collector', async () => {
    authState.role = USER_ROLE.COLLECTOR;
    const user = userEvent.setup();
    renderShell(
      <CollectorShell>
        <div>Collector content</div>
      </CollectorShell>,
    );

    expect(screen.queryByRole('link', { name: 'Operations' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Audit Log' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Loan Pools' })).not.toBeInTheDocument();

    const menuButtons = screen.getAllByRole('button', { name: 'Open navigation menu' });
    await user.click(menuButtons[menuButtons.length - 1]!);
    const drawer = await screen.findByRole('dialog', { name: /Collector navigation/i });

    expect(within(drawer).queryByRole('link', { name: 'Operations' })).not.toBeInTheDocument();
    expect(
      within(drawer).getByRole('link', { name: 'Borrowers' }),
    ).toHaveAttribute('href', '/collector/my-borrowers');
  });
});
