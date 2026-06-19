import { beforeEach, describe, expect, it } from 'vitest';
import { USER_ROLE } from '@/constants/roles';
import { useAuthStore } from '@/state/authStore';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      expiresAt: null,
      isHydrated: false,
      isExpired: false,
    });
  });

  it('hydrates a valid session', () => {
    useAuthStore.getState().hydrate(
      { id: 'user-1', role: USER_ROLE.COLLECTOR },
      Date.now() + 60_000,
    );

    const state = useAuthStore.getState();
    expect(state.user?.role).toBe(USER_ROLE.COLLECTOR);
    expect(state.isHydrated).toBe(true);
    expect(state.isExpired).toBe(false);
  });

  it('marks expired sessions as invalid', () => {
    useAuthStore.getState().hydrate(
      { id: 'user-1', role: USER_ROLE.COLLECTOR },
      Date.now() - 1,
    );

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isExpired).toBe(true);
  });

  it('marks an active session as expired', () => {
    useAuthStore.getState().setSession(
      { id: 'user-1', role: USER_ROLE.COLLECTOR },
      Date.now() + 60_000,
    );

    useAuthStore.getState().markSessionExpired();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isExpired).toBe(true);
    expect(state.isHydrated).toBe(true);
  });

  it('clears session state', () => {
    useAuthStore.getState().setSession(
      { id: 'user-1', role: USER_ROLE.APPROVER },
      Date.now() + 60_000,
    );
    useAuthStore.getState().clearSession();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isHydrated).toBe(true);
  });
});
