import { afterEach, describe, expect, it, vi } from 'vitest';

describe('resolveDataProviderMode', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses api mode in development when NEXT_PUBLIC_USE_MOCK=false and API URL is set', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'http://127.0.0.1:3000/api/wilms');
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK', 'false');
    vi.stubEnv('NODE_ENV', 'development');

    const { resolveDataProviderMode } = await import('@/data-provider/types');
    expect(resolveDataProviderMode()).toBe('api');
  });

  it('uses mock mode in development by default', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'http://127.0.0.1:3000/api/wilms');
    vi.stubEnv('NODE_ENV', 'development');

    const { resolveDataProviderMode } = await import('@/data-provider/types');
    expect(resolveDataProviderMode()).toBe('mock');
  });
});
