import { describe, expect, it } from 'vitest';
import { USER_ROLE } from '@wilms/shared-rbac';
import { createApp } from '../../http/app.js';
import { encodeSessionToken } from '../../middleware/authenticate.js';

function buildToken(role: string, userId: string): string {
  return encodeSessionToken({
    userId,
    role: role as never,
    expiresAt: Date.now() + 60_000,
  });
}

async function request(
  path: string,
  options: { method?: string; token?: string } = {},
): Promise<number> {
  const app = createApp();
  const server = app.listen(0);
  const port = typeof server.address() === 'object' && server.address() ? server.address()!.port : 0;

  try {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
    });
    return response.status;
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

describe('borrower list RBAC', () => {
  it('blocks collectors from listing all borrowers', async () => {
    const token = buildToken(USER_ROLE.COLLECTOR, 'collector-user');
    expect(await request('/borrowers', { token })).toBe(403);
  });

  it('blocks auditors from pending queue without review permission', async () => {
    const token = buildToken(USER_ROLE.AUDITOR, 'auditor-user');
    expect(await request('/borrowers?status=PENDING', { token })).toBe(403);
  });

  it('allows auditors to list approved borrower summaries', async () => {
    const token = buildToken(USER_ROLE.AUDITOR, 'auditor-user');
    expect(await request('/borrowers', { token })).toBe(200);
  });

  it('allows collectors with portal access to search', async () => {
    const token = buildToken(USER_ROLE.COLLECTOR, 'collector-user');
    expect(await request('/search?q=test', { token })).toBe(200);
  });

  it('allows collectors with portal access to use collector dashboard route', async () => {
    const token = buildToken(USER_ROLE.COLLECTOR, 'collector-user');
    expect(await request('/collector/collector-user/dashboard', { token })).toBe(200);
  });
});
