import { API_ERROR_CODE, ApiError } from '@/types/api';
import type {
  CompleteOnboardingInput,
  LoginInput,
  LoginResponse,
  LoginResult,
  VerifyOtpInput,
} from '@/types/auth';
import type { IAuthService } from '@/types/services';
import { csrfHeaders, readCsrfFromDocumentCookie } from '@/lib/auth/csrf';
import { isLoginOtpChallenge } from '@/types/auth';

async function ensureCsrfToken(): Promise<void> {
  if (typeof document === 'undefined' || readCsrfFromDocumentCookie()) {
    return;
  }

  await fetch('/api/auth/csrf', { credentials: 'include' });
}

export { ensureCsrfToken };

async function postAuthJson<T>(path: string, body: unknown): Promise<T> {
  await ensureCsrfToken();

  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...csrfHeaders(),
    },
    credentials: 'include',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;

    if (response.status === 401) {
      throw new ApiError(
        payload?.message ?? 'Authentication failed.',
        API_ERROR_CODE.UNAUTHORIZED,
        401,
      );
    }

    if (response.status === 422) {
      throw new ApiError(
        payload?.message ?? 'Please check your details.',
        API_ERROR_CODE.VALIDATION,
        422,
      );
    }

    throw new ApiError(
      payload?.message ?? 'Unable to complete the request.',
      API_ERROR_CODE.SERVER,
      response.status,
    );
  }

  return response.json() as Promise<T>;
}

const authService: IAuthService = {
  async login(input: LoginInput): Promise<LoginResponse> {
    const result = await postAuthJson<LoginResponse>('/api/auth/login', input);
    if (isLoginOtpChallenge(result)) {
      return result;
    }
    return result;
  },

  async verifyOtp(input: VerifyOtpInput): Promise<LoginResult> {
    return postAuthJson<LoginResult>('/api/auth/verify-otp', input);
  },

  async completeOnboarding(input: CompleteOnboardingInput): Promise<LoginResult> {
    return postAuthJson<LoginResult>('/api/auth/complete-onboarding', input);
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
