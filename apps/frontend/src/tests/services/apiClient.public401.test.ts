import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/routes', () => ({
  isPublicPath: (path: string) => path === '/login' || path.startsWith('/session-expired'),
}));

describe('apiClient unauthorized handling', () => {
  it('does not trigger session handler on public paths', async () => {
    const { setUnauthorizedHandler } = await import('@/lib/auth/unauthorized-handler');
    const handler = vi.fn();
    setUnauthorizedHandler(handler);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      }),
    );

    Object.defineProperty(window, 'location', {
      value: { pathname: '/login' },
      writable: true,
    });

    const { apiClient } = await import('@/utils/apiClient');

    await expect(apiClient.get('/loans')).rejects.toThrow();
    expect(handler).not.toHaveBeenCalled();

    setUnauthorizedHandler(null);
    vi.unstubAllGlobals();
  });
});
