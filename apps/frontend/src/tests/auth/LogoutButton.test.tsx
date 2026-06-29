import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { useAuthStore } from '@/state/authStore';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

describe('LogoutButton', () => {
  beforeEach(() => {
    replace.mockReset();
    useAuthStore.setState({
      user: { id: 'user-approver', role: 'APPROVER', displayName: 'Test Approver' },
      expiresAt: Date.now() + 60_000,
      isHydrated: true,
      isExpired: false,
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      }),
    );
  });

  it('clears the session and redirects to login', async () => {
    const user = userEvent.setup();
    render(<LogoutButton />);

    await user.click(screen.getByRole('button', { name: 'Log out' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {},
      });
      expect(useAuthStore.getState().user).toBeNull();
      expect(replace).toHaveBeenCalledWith('/login');
    });
  });
});
