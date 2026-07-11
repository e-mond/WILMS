import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { USER_ROLE } from '@/constants/roles';

const { replace, login, setSession } = vi.hoisted(() => ({
  replace: vi.fn(),
  login: vi.fn(),
  setSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams('next=%2Fcollector%2Fdashboard'),
}));

vi.mock('@/services', () => ({
  authService: {
    login,
  },
}));

vi.mock('@/state/authStore', () => ({
  useAuthStore: (selector: (state: { setSession: typeof setSession }) => unknown) =>
    selector({ setSession }),
}));

vi.mock('@/state/loginPreferencesStore', () => ({
  useLoginPreferencesStore: (
    selector: (state: {
      rememberEmail: boolean;
      rememberedEmail: string;
      isHydrated: boolean;
      setRememberEmail: ReturnType<typeof vi.fn>;
      setRememberedEmail: ReturnType<typeof vi.fn>;
    }) => unknown,
  ) =>
    selector({
      rememberEmail: false,
      rememberedEmail: '',
      isHydrated: true,
      setRememberEmail: vi.fn(),
      setRememberedEmail: vi.fn(),
    }),
}));

import { LoginForm } from '@/features/authentication/components/LoginForm';

describe('LoginForm', () => {
  beforeEach(() => {
    replace.mockReset();
    login.mockReset();
    setSession.mockReset();
  });

  it('shows field validation errors for invalid input', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
  });

  it('renders password visibility toggle and remember email checkbox', () => {
    render(<LoginForm />);

    expect(screen.getByRole('button', { name: 'Show password' })).toBeInTheDocument();
    expect(screen.getByLabelText('Remember email')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Welcome Back' })).toBeInTheDocument();
  });

  it('submits valid credentials and redirects safely', async () => {
    const user = userEvent.setup();

    login.mockResolvedValue({
      user: {
        id: 'user-collector',
        role: USER_ROLE.COLLECTOR,
        displayName: 'Field Collector',
      },
      expiresAt: Date.now() + 60_000,
    });

    render(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'collector@wilms.demo');
    await user.type(screen.getByLabelText('Password'), 'DemoCollect1!');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: 'collector@wilms.demo',
        password: 'DemoCollect1!',
      });
    });

    expect(setSession).toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith('/collector/dashboard');
  });
});
