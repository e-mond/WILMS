import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppLockHandler } from '@/components/auth/AppLockHandler';
import { useAppLockStore } from '@/state/appLockStore';

const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/collector/dashboard',
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-collector', role: 'COLLECTOR', displayName: 'Field Collector' },
    isAuthenticated: true,
    isHydrated: true,
    isExpired: false,
  }),
}));

vi.mock('@/hooks/useLogout', () => ({
  useLogout: () => ({
    logout: vi.fn(),
    isLoggingOut: false,
  }),
}));

describe('AppLockHandler', () => {
  beforeEach(() => {
    replaceMock.mockReset();
    useAppLockStore.setState({
      isEnabled: true,
      pinHash: 'abc',
      pinUserId: 'user-collector',
      isHydrated: true,
      isLocked: true,
      failedAttempts: 0,
      lastActivityAt: Date.now(),
      sessionStartedAt: Date.now() - 120_000,
    });
  });

  it('renders the lock overlay when locked', () => {
    const { getByRole } = render(<AppLockHandler />);

    expect(getByRole('dialog')).toBeInTheDocument();
    expect(getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
  });

  it('renders nothing when unlocked', () => {
    useAppLockStore.setState({ isLocked: false });

    const { container } = render(<AppLockHandler />);

    expect(container).toBeEmptyDOMElement();
  });
});
