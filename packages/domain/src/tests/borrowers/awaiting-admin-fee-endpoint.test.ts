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
): Promise<{ status: number; body: unknown }> {
  const app = createApp();
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;

  try {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
    });
    const body = await response.json().catch(() => null);
    return { status: response.status, body };
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

describe('GET /borrowers/awaiting-admin-fee', () => {
  it('returns awaiting borrowers for collectors with portal access', async () => {
    const token = buildToken(USER_ROLE.COLLECTOR, 'user-collector');
    const { status, body } = await request('/borrowers/awaiting-admin-fee', { token });

    expect(status).toBe(200);
    expect(body).toEqual(
      expect.objectContaining({
        data: expect.any(Array),
      }),
    );
  });

  it('returns awaiting borrowers for super admins', async () => {
    const token = buildToken(USER_ROLE.SUPER_ADMIN, 'user-super-admin');
    const { status } = await request('/borrowers/awaiting-admin-fee', { token });

    expect(status).toBe(200);
  });

  it('blocks users without admin-fee permissions', async () => {
    const token = buildToken(USER_ROLE.AUDITOR, 'user-auditor');
    const { status } = await request('/borrowers/awaiting-admin-fee', { token });

    expect(status).toBe(403);
  });
});
