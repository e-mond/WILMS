import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  APPROVER_NAV,
  COLLECTOR_NAV,
  REGISTRATION_OFFICER_NAV,
  SUPER_ADMIN_NAV,
} from '@/constants/navigation';
import { THEME_MODE } from '@/constants/theme';
import { ApproverShell } from '@/layouts/ApproverShell';
import { CollectorShell } from '@/layouts/CollectorShell';
import { RegistrationOfficerShell } from '@/layouts/RegistrationOfficerShell';
import { SuperAdminShell } from '@/layouts/SuperAdminShell';
import { useThemeStore } from '@/state/themeStore';
import { useUiStore } from '@/state/uiStore';
import { USER_ROLE } from '@/constants/roles';
import { PermissionProvider } from '@/components/providers/PermissionProvider';
import { TestQueryProvider } from '@/tests/utils/test-query-client';

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

describe('role shells', () => {
  beforeEach(() => {
    useThemeStore.setState({ mode: THEME_MODE.LIGHT, isHydrated: true });
    useUiStore.setState({ toasts: [], isMobileNavOpen: false, isAsideDrawerOpen: false });
    localStorage.removeItem('wilms-executive-default-dark-applied');
  });

  async function openMobileNavigation(user: ReturnType<typeof userEvent.setup>, roleLabel: string) {
    const openButtons = screen.getAllByRole('button', { name: 'Open navigation menu' });
    await user.click(openButtons[openButtons.length - 1]!);
    const drawerName = /navigation$/i.test(roleLabel) ? roleLabel : `${roleLabel} navigation`;
    return screen.getByRole('dialog', { name: drawerName });
  }

  it('renders super admin sidebar navigation with shared office chrome', async () => {
    const user = userEvent.setup();
    renderShell(<SuperAdminShell><div>Content</div></SuperAdminShell>);

    expect(screen.getByText('Content')).toBeInTheDocument();
    const drawer = await openMobileNavigation(user, 'Super Admin');
    expect(within(drawer).getByRole('navigation', { name: 'Super Admin' })).toBeInTheDocument();
    expect(within(drawer).getByRole('button', { name: 'Log out' })).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: /Switch to (dark|light) mode/ }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/All systems operational/)).toBeInTheDocument();

    for (const item of SUPER_ADMIN_NAV) {
      expect(within(drawer).getByRole('link', { name: item.label })).toHaveAttribute(
        'href',
        item.href,
      );
    }
  });

  it('renders collector navigation with responsive executive shell chrome', () => {
    renderShell(<CollectorShell><div>Collector content</div></CollectorShell>);

    expect(screen.getByText('Collector content')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open navigation menu' })).not.toBeInTheDocument();
    expect(
      screen.getAllByRole('navigation', { name: 'Collector Navigation' }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('button', { name: 'Log out' }).length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByRole('button', { name: /Switch to (dark|light) mode/ }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('WILMS').length).toBeGreaterThanOrEqual(1);

    for (const item of COLLECTOR_NAV) {
      const links = screen.getAllByRole('link', { name: item.label });
      expect(links.some((link) => link.getAttribute('href') === item.href)).toBe(true);
    }
  });

  it('renders registration officer navigation with office header and footer', () => {
    renderShell(<RegistrationOfficerShell><div>Officer content</div></RegistrationOfficerShell>);

    expect(screen.getAllByText('WILMS').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByRole('button', { name: 'Open navigation menu' })).not.toBeInTheDocument();
    expect(
      screen.getAllByRole('navigation', { name: 'Registration Officer bottom navigation' }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/All systems operational/)).toBeInTheDocument();

    for (const item of REGISTRATION_OFFICER_NAV) {
      const links = screen.getAllByRole('link', { name: item.label });
      expect(links.some((link) => link.getAttribute('href') === item.href)).toBe(true);
    }
  });

  it('renders approver queue navigation with office header and footer', () => {
    renderShell(<ApproverShell><div>Approver content</div></ApproverShell>);

    expect(screen.getAllByText('WILMS').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByRole('button', { name: 'Open navigation menu' })).not.toBeInTheDocument();
    expect(
      screen.getAllByRole('navigation', { name: 'Approver Navigation bottom navigation' }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/All systems operational/)).toBeInTheDocument();

    for (const item of APPROVER_NAV) {
      const links = screen.getAllByRole('link', { name: item.label });
      expect(links.some((link) => link.getAttribute('href') === item.href)).toBe(true);
    }
  });

  it('toggles theme mode from the shell header', async () => {
    localStorage.setItem('wilms-executive-default-dark-applied', '1');
    useThemeStore.setState({ mode: THEME_MODE.LIGHT, isHydrated: true });
    const user = userEvent.setup();

    renderShell(<SuperAdminShell><div>Content</div></SuperAdminShell>);

    const themeButtons = screen.getAllByRole('button', { name: 'Switch to dark mode' });
    await user.click(themeButtons[0]);
    expect(useThemeStore.getState().mode).toBe(THEME_MODE.DARK);
  });
});
