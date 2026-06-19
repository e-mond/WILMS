import { describe, expect, it } from 'vitest';
import { USER_ROLE } from '@/constants/roles';
import { resolveMiddlewareAuth } from '@/lib/auth/middleware';
import { encodeSessionPayload } from '@/lib/auth/session';

function createRequest(pathname: string, cookieValue?: string) {
  return {
    nextUrl: new URL(`http://localhost:3000${pathname}`),
    cookies: {
      get: (name: string) =>
        name === 'wilms_session' && cookieValue
          ? { name, value: cookieValue }
          : undefined,
    },
  };
}

describe('resolveMiddlewareAuth', () => {
  it('redirects unauthenticated users to login', () => {
    const result = resolveMiddlewareAuth(createRequest('/dashboard'));

    expect(result).toEqual({
      type: 'redirect',
      destination: '/login?next=%2Fdashboard',
    });
  });

  it('redirects authenticated users away from login', () => {
    const cookie = encodeSessionPayload({
      userId: 'admin-1',
      role: USER_ROLE.SUPER_ADMIN,
      expiresAt: Date.now() + 60_000,
    });

    const result = resolveMiddlewareAuth(createRequest('/login', cookie));

    expect(result).toEqual({
      type: 'redirect',
      destination: '/dashboard',
    });
  });

  it('blocks cross-role access', () => {
    const cookie = encodeSessionPayload({
      userId: 'collector-1',
      role: USER_ROLE.COLLECTOR,
      expiresAt: Date.now() + 60_000,
    });

    const result = resolveMiddlewareAuth(createRequest('/dashboard', cookie));

    expect(result).toEqual({
      type: 'redirect',
      destination: '/collector/dashboard',
    });
  });

  it('redirects expired sessions to session-expired and clears cookie', () => {
    const cookie = encodeSessionPayload({
      userId: 'collector-1',
      role: USER_ROLE.COLLECTOR,
      expiresAt: Date.now() - 1,
    });

    const result = resolveMiddlewareAuth(createRequest('/collector/dashboard', cookie));

    expect(result).toEqual({
      type: 'redirect',
      destination: '/session-expired?next=%2Fcollector%2Fdashboard',
      clearSession: true,
    });
  });

  it('allows role-appropriate paths', () => {
    const cookie = encodeSessionPayload({
      userId: 'approver-1',
      role: USER_ROLE.APPROVER,
      expiresAt: Date.now() + 60_000,
    });

    const result = resolveMiddlewareAuth(createRequest('/approver/pending', cookie));

    expect(result).toEqual({ type: 'allow' });
  });
});
