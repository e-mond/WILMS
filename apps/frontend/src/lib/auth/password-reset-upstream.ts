import { USE_MOCK_SERVICES } from '@/config/api';
import {
  extractApiErrorMessage,
  unwrapApiSuccessData,
} from '@/lib/api/error-body';

export class UpstreamAuthError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'UpstreamAuthError';
    this.status = status;
  }
}

export function resolveAuthUpstreamBase(): string {
  const upstream = process.env.WILMS_API_UPSTREAM?.trim().replace(/\/$/, '');
  if (upstream) {
    return upstream;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new UpstreamAuthError(
      'Password reset service is not configured. Set WILMS_API_UPSTREAM on the frontend deployment.',
      503,
    );
  }

  return 'http://127.0.0.1:4000';
}

export async function postUpstreamAuth<T>(
  path: string,
  body: object,
  options?: { authorization?: string },
): Promise<T> {
  if (USE_MOCK_SERVICES) {
    return { ok: true } as T;
  }

  let upstream: string;

  try {
    upstream = resolveAuthUpstreamBase();
  } catch (error) {
    if (error instanceof UpstreamAuthError) {
      throw error;
    }
    throw new UpstreamAuthError('Password reset service is unavailable.', 503);
  }

  let response: Response;

  try {
    response = await fetch(`${upstream}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options?.authorization ? { Authorization: options.authorization } : {}),
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
  } catch {
    throw new UpstreamAuthError(
      'Unable to reach the authentication service. Check your connection and try again.',
      503,
    );
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      extractApiErrorMessage(payload) ??
      (response.status >= 500
        ? 'Authentication service is temporarily unavailable.'
        : 'Unable to complete the request.');

    throw new UpstreamAuthError(message, response.status);
  }

  return unwrapApiSuccessData<T>(payload);
}

export async function requestPasswordResetUpstream(email: string): Promise<{ ok: true }> {
  return postUpstreamAuth<{ ok: true }>('/auth/forgot-password', { email });
}

export async function resetPasswordWithTokenUpstream(
  token: string,
  newPassword: string,
): Promise<{ ok: true }> {
  return postUpstreamAuth<{ ok: true }>('/auth/reset-password', { token, newPassword });
}
