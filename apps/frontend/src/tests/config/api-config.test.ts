import { describe, expect, it, vi } from 'vitest';

describe('normalizeApiBaseUrl via config/api', () => {
  it('appends /api/wilms when the env base URL omits the BFF path', async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:3000/');

    const { API_BASE_URL } = await import('@/config/api');

    expect(API_BASE_URL).toBe('http://localhost:3000/api/wilms');
  });

  it('preserves an already-normalized API base URL', async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'http://127.0.0.1:3000/api/wilms');

    const { API_BASE_URL } = await import('@/config/api');

    expect(API_BASE_URL).toBe('http://127.0.0.1:3000/api/wilms');
  });
});

describe('formatBorrowerDisplayId', () => {
  it('builds a structured borrower display id', async () => {
    const { formatBorrowerDisplayId } = await import('@/utils/format-borrower-display-id');

    expect(
      formatBorrowerDisplayId(
        { community: 'Madina', registeredAt: '2026-03-15T10:00:00.000Z', id: 'uuid' },
        12,
      ),
    ).toBe('BWR-MADI-202603-0012');
  });
});
