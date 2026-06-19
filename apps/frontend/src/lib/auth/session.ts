import { ALL_USER_ROLES, type UserRole } from '@/constants/roles';
import type { AuthSession, SessionPayload, SessionUser } from '@/types/auth';

export const SESSION_COOKIE_NAME = 'wilms_session';

function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && ALL_USER_ROLES.includes(value as UserRole);
}

export function encodeSessionPayload(payload: SessionPayload): string {
  const json = JSON.stringify(payload);
  return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeSessionPayload(value: string | undefined | null): SessionPayload | null {
  if (!value) {
    return null;
  }

  try {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    const json = atob(`${base64}${padding}`);
    const parsed = JSON.parse(json) as Partial<SessionPayload>;

    if (
      typeof parsed.userId !== 'string' ||
      !isUserRole(parsed.role) ||
      typeof parsed.expiresAt !== 'number'
    ) {
      return null;
    }

    return {
      userId: parsed.userId,
      role: parsed.role,
      displayName: typeof parsed.displayName === 'string' ? parsed.displayName : undefined,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}

export function isSessionPayloadValid(payload: SessionPayload | null): payload is SessionPayload {
  if (!payload) {
    return false;
  }

  return payload.expiresAt > Date.now();
}

export function toAuthSession(payload: SessionPayload): AuthSession {
  const user: SessionUser = {
    id: payload.userId,
    role: payload.role,
    displayName: payload.displayName,
  };

  return {
    user,
    expiresAt: payload.expiresAt,
  };
}

export function parseSessionCookie(value: string | undefined | null): AuthSession | null {
  const state = parseSessionCookieState(value);

  if (state.status !== 'valid') {
    return null;
  }

  return state.session;
}

export type SessionCookieState =
  | { status: 'missing' }
  | { status: 'expired'; payload: SessionPayload }
  | { status: 'valid'; session: AuthSession };

export function parseSessionCookieState(
  value: string | undefined | null,
): SessionCookieState {
  const payload = decodeSessionPayload(value);

  if (!payload) {
    return { status: 'missing' };
  }

  if (!isSessionPayloadValid(payload)) {
    return { status: 'expired', payload };
  }

  return { status: 'valid', session: toAuthSession(payload) };
}
