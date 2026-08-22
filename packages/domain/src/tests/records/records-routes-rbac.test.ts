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

async function requestStatus(
  path: string,
  options: { token?: string } = {},
): Promise<number> {
  const app = createApp();
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;

  try {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method: 'GET',
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

describe('records routes RBAC', () => {
  it('denies collectors org-wide record search', async () => {
    const token = buildToken(USER_ROLE.COLLECTOR, 'collector-records-audit');
    expect(await requestStatus('/records/search?q=test', { token })).toBe(403);
  });

  it('allows registration officers org-wide record search', async () => {
    const token = buildToken(USER_ROLE.REGISTRATION_OFFICER, 'officer-records-audit');
    expect(await requestStatus('/records/search?q=test', { token })).not.toBe(403);
  });

  it('allows super admin org-wide record search', async () => {
    const token = buildToken(USER_ROLE.SUPER_ADMIN, 'admin-records-audit');
    expect(await requestStatus('/records/search?q=test', { token })).not.toBe(403);
  });
});
