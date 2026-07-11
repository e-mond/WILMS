/**
 * Maps BFF /api/wilms/* paths to backend Express paths.
 * Auth routes live at /auth/* (not /api/v1/auth/*).
 */
export function resolveWilmsProxyUpstreamPath(path: string, search = ''): string {
  const normalized = path.replace(/^\/+/, '');

  if (normalized === 'health') {
    return `/health${search}`;
  }

  if (normalized.startsWith('auth/')) {
    return `/${normalized}${search}`;
  }

  return `/api/v1/${normalized}${search}`;
}
