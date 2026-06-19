import { beforeEach, describe, expect, it } from 'vitest';
import { APP_LOCK_MAX_ATTEMPTS } from '@/constants/app-lock';
import { useAppLockStore } from '@/state/appLockStore';

describe('appLockStore', () => {
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
    localStorage.removeItem('wilms-app-lock');
  });

  it('stores a hashed pin for the active user', () => {
    useAppLockStore.getState().setPin('123456', 'user-collector');

    const state = useAppLockStore.getState();
    expect(state.isEnabled).toBe(true);
    expect(state.pinUserId).toBe('user-collector');
    expect(state.pinHash).toBeTruthy();
    expect(state.pinHash).not.toBe('123456');
  });

  it('unlocks with the correct pin and tracks failed attempts', () => {
    useAppLockStore.getState().setPin('123456', 'user-collector');
    useAppLockStore.getState().lock();

    const wrong = useAppLockStore.getState().verifyAndUnlock('000000', 'user-collector');
    expect(wrong.success).toBe(false);
    expect(wrong.attemptsRemaining).toBe(APP_LOCK_MAX_ATTEMPTS - 1);

    const correct = useAppLockStore.getState().verifyAndUnlock('123456', 'user-collector');
    expect(correct.success).toBe(true);
    expect(useAppLockStore.getState().isLocked).toBe(false);
  });

  it('clears pin settings when a different user signs in', () => {
    useAppLockStore.getState().setPin('123456', 'user-collector');
    useAppLockStore.getState().syncUser('user-officer');

    expect(useAppLockStore.getState().isEnabled).toBe(false);
    expect(useAppLockStore.getState().pinHash).toBeNull();
  });
});
