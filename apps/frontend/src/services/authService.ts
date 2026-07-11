import { API_ERROR_CODE, ApiError } from '@/types/api';
import type {
  CompleteOnboardingInput,
  LoginInput,
  LoginResponse,
  LoginResult,
  VerifyOtpInput,
} from '@/types/auth';
import type { IAuthService } from '@/types/services';
import { extractApiErrorMessage } from '@/lib/api/error-body';
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

  let response: Response;

  try {
    response = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeaders(),
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      'Unable to reach the server. Check your connection and try again.',
      API_ERROR_CODE.NETWORK,
    );
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = extractApiErrorMessage(payload);

    if (response.status === 401) {
      throw new ApiError(
        message ?? 'Authentication failed.',
        API_ERROR_CODE.UNAUTHORIZED,
        401,
      );
    }

    if (response.status === 422) {
      throw new ApiError(
        message ?? 'Please check your details.',
        API_ERROR_CODE.VALIDATION,
        422,
      );
    }

    if (response.status === 429) {
      throw new ApiError(
        message ?? 'Too many attempts. Please try again later.',
        API_ERROR_CODE.VALIDATION,
        429,
      );
    }

    if (response.status >= 500) {
      throw new ApiError(
        message ?? 'Service is temporarily unavailable.',
        API_ERROR_CODE.SERVER,
        response.status,
      );
    }

    throw new ApiError(
      message ?? 'Unable to complete the request.',
      API_ERROR_CODE.SERVER,
      response.status,
    );
  }

  return payload as T;
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
    return postAuthJson<{ ok: true }>('/api/auth/forgot-password', { email });
  },

  async resetPassword(token: string, newPassword: string): Promise<{ ok: true }> {
    return postAuthJson<{ ok: true }>('/api/auth/reset-password', { token, newPassword });
  },
};

export default authService;
