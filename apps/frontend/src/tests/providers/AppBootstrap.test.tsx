import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppBootstrap } from '@/components/providers/AppBootstrap';
import { useAppLockStore } from '@/state/appLockStore';
import { useAuthStore } from '@/state/authStore';
import { useThemeStore } from '@/state/themeStore';

vi.mock('framer-motion', () => ({
  useReducedMotion: () => true,
}));

describe('AppBootstrap', () => {
  beforeEach(() => {
    useAuthStore.setState({ isHydrated: false, user: null, expiresAt: null, isExpired: false });
    useThemeStore.setState({ isHydrated: false, mode: 'light' });
    useAppLockStore.setState({
      isEnabled: false,
      pinHash: null,
      pinUserId: null,
      isHydrated: false,
      isLocked: false,
      failedAttempts: 0,
      lastActivityAt: Date.now(),
    });
  });

  it('shows splash until client stores are hydrated', () => {
    render(
      <AppBootstrap>
        <p>Application ready</p>
      </AppBootstrap>,
    );

    expect(screen.getByLabelText('Restoring your session…')).toBeInTheDocument();
    expect(screen.queryByText('Application ready')).not.toBeInTheDocument();
  });

  it('renders children after hydration', () => {
    useAuthStore.setState({ isHydrated: true });
    useThemeStore.setState({ isHydrated: true });
    useAppLockStore.setState({ isHydrated: true });

    render(
      <AppBootstrap>
        <p>Application ready</p>
      </AppBootstrap>,
    );

    expect(screen.getByText('Application ready')).toBeInTheDocument();
  });
});
