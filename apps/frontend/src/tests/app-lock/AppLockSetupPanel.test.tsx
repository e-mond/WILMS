import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppLockSetupPanel } from '@/features/app-lock/components/AppLockSetupPanel';
import { useAppLockStore } from '@/state/appLockStore';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-collector', role: 'COLLECTOR', displayName: 'Field Collector' },
    isAuthenticated: true,
    isHydrated: true,
    isExpired: false,
  }),
}));

async function enterPin(user: ReturnType<typeof userEvent.setup>, pin: string) {
  for (const digit of pin.split('')) {
    await user.click(screen.getByRole('button', { name: `Digit ${digit}` }));
  }
}

describe('AppLockSetupPanel', () => {
  beforeEach(() => {
    useAppLockStore.setState({
      isEnabled: false,
      pinHash: null,
      pinUserId: null,
      isHydrated: true,
      isLocked: false,
      failedAttempts: 0,
      lastActivityAt: Date.now(),
    });
  });

  it('enables app lock after matching pin confirmation', async () => {
    const user = userEvent.setup();

    render(<AppLockSetupPanel />);

    await user.click(screen.getByRole('button', { name: 'Set up app lock' }));
    await enterPin(user, '123456');
    await enterPin(user, '123456');

    expect(await screen.findByText('Six-digit app lock enabled.')).toBeInTheDocument();
    expect(useAppLockStore.getState().isEnabled).toBe(true);
  });

  it('disables app lock', async () => {
    const user = userEvent.setup();
    useAppLockStore.getState().setPin('123456', 'user-collector');

    render(<AppLockSetupPanel />);

    await user.click(screen.getByRole('button', { name: 'Disable app lock' }));

    expect(await screen.findByText('App lock disabled on this device.')).toBeInTheDocument();
    expect(useAppLockStore.getState().isEnabled).toBe(false);
  });
});
