export const CSRF_COOKIE_NAME = 'wilms_csrf';
export const CSRF_HEADER_NAME = 'x-wilms-csrf';

const ONE_DAY_SECONDS = 60 * 60 * 24;

export interface CsrfCookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  path: string;
  maxAge: number;
}

export function getCsrfCookieOptions(maxAgeSeconds = ONE_DAY_SECONDS): CsrfCookieOptions {
  return {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

export function readCsrfFromDocumentCookie(): string | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }

  const match = document.cookie.match(/(?:^|;\s*)wilms_csrf=([^;]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

export function csrfHeaders(): Record<string, string> {
  const token = readCsrfFromDocumentCookie();
  return token ? { [CSRF_HEADER_NAME]: token } : {};
}
