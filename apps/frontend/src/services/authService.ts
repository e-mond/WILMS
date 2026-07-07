import { API_ERROR_CODE, ApiError } from '@/types/api';
import type { LoginInput, LoginResult } from '@/types/auth';
import type { IAuthService } from '@/types/services';
import { csrfHeaders, readCsrfFromDocumentCookie } from '@/lib/auth/csrf';

async function ensureCsrfToken(): Promise<void> {
  if (typeof document === 'undefined' || readCsrfFromDocumentCookie()) {
    return;
  }

  await fetch('/api/auth/csrf', { credentials: 'include' });
}

export { ensureCsrfToken };

const authService: IAuthService = {
  async login(input: LoginInput): Promise<LoginResult> {
    await ensureCsrfToken();

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeaders(),
      },
      credentials: 'include',
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: string } | null;

      if (response.status === 401) {
        throw new ApiError(
          body?.message ?? 'Invalid email or password.',
          API_ERROR_CODE.UNAUTHORIZED,
          401,
        );
      }

      if (response.status === 422) {
        throw new ApiError(
          body?.message ?? 'Please check your login details.',
          API_ERROR_CODE.VALIDATION,
          422,
        );
      }

      throw new ApiError(
        'Unable to sign in right now. Please try again.',
        API_ERROR_CODE.SERVER,
        response.status,
      );
    }

    return response.json() as Promise<LoginResult>;
  },

  async requestPasswordReset(email: string): Promise<{ ok: true }> {
    await ensureCsrfToken();

    const response = await fetch('/api/wilms/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeaders(),
      },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      throw new ApiError(
        body?.message ?? 'Unable to process reset request.',
        API_ERROR_CODE.VALIDATION,
        response.status,
      );
    }

    return { ok: true };
  },

  async resetPassword(token: string, newPassword: string): Promise<{ ok: true }> {
    await ensureCsrfToken();

    const response = await fetch('/api/wilms/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeaders(),
      },
      credentials: 'include',
      body: JSON.stringify({ token, newPassword }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      throw new ApiError(
        body?.message ?? 'Unable to reset password.',
        API_ERROR_CODE.VALIDATION,
        response.status,
      );
    }

    return { ok: true };
  },
};

export default authService;
