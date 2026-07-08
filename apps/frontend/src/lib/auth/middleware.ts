import { canRoleAccessPath, getRoleHomePath, isPublicPath } from '@/lib/auth/routes';
import { buildSessionExpiredUrl } from '@/lib/auth/session-expiry';
import { parseSessionCookieState, SESSION_COOKIE_NAME } from '@/lib/auth/session';

export type MiddlewareAuthResult =
  | { type: 'allow' }
  | { type: 'redirect'; destination: string; clearSession?: boolean };

export interface MiddlewareAuthRequest {
  nextUrl: {
    pathname: string;
    origin: string;
  };
  cookies: {
    get: (name: string) => { value: string } | undefined;
  };
}

export function resolveMiddlewareAuth(
  request: MiddlewareAuthRequest,
): MiddlewareAuthResult {
  const { pathname } = request.nextUrl;

  if (pathname === '/capture' || pathname.startsWith('/capture/')) {
    return { type: 'allow' };
  }

  const sessionState = parseSessionCookieState(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
  );

  if (isPublicPath(pathname)) {
    if (sessionState.status === 'valid') {
      const status = sessionState.session.user.status;

      if (status === 'INVITED') {
        return { type: 'redirect', destination: '/complete-profile' };
      }

      if (pathname === '/login' || pathname === '/accept-invitation') {
        return {
          type: 'redirect',
          destination: getRoleHomePath(sessionState.session.user.role),
        };
      }

      return {
        type: 'redirect',
        destination: getRoleHomePath(sessionState.session.user.role),
      };
    }

    if (sessionState.status === 'expired' && pathname !== '/session-expired') {
      return {
        type: 'redirect',
        destination: buildSessionExpiredUrl(pathname),
        clearSession: true,
      };
    }

    return { type: 'allow' };
  }

  if (sessionState.status === 'expired') {
    return {
      type: 'redirect',
      destination: buildSessionExpiredUrl(pathname),
      clearSession: true,
    };
  }

  if (sessionState.status === 'missing') {
    const loginUrl = new URL('/login', request.nextUrl.origin);
    loginUrl.searchParams.set('next', pathname);
    return { type: 'redirect', destination: `${loginUrl.pathname}${loginUrl.search}` };
  }

  const session = sessionState.session;

  if (session.user.status === 'INVITED') {
    if (pathname === '/complete-profile') {
      return { type: 'allow' };
    }
    return { type: 'redirect', destination: '/complete-profile' };
  }

  if (pathname === '/complete-profile') {
    return {
      type: 'redirect',
      destination: getRoleHomePath(session.user.role),
    };
  }

  if (pathname === '/') {
    return {
      type: 'redirect',
      destination: getRoleHomePath(session.user.role),
    };
  }

  if (!canRoleAccessPath(session.user.role, pathname, session.user.id)) {
    return {
      type: 'redirect',
      destination: getRoleHomePath(session.user.role),
    };
  }

  return { type: 'allow' };
}
