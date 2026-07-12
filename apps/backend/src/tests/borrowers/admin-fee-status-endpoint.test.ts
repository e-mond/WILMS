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

describe('GET /borrowers/:id/admin-fee-status', () => {
  it('allows collectors with RECORD_COLLECTIONS to read admin fee status', async () => {
    const awaitingToken = buildToken(USER_ROLE.COLLECTOR, 'user-collector');
    const app = createApp();
    const server = app.listen(0);
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;

    try {
      const awaitingResponse = await fetch(
        `http://127.0.0.1:${port}/borrowers/awaiting-admin-fee`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${awaitingToken}`,
          },
        },
      );
      const awaitingBody = (await awaitingResponse.json()) as {
        data?: Array<{ id: string }>;
      };
      const borrowerId = awaitingBody.data?.[0]?.id;

      if (!borrowerId) {
        return;
      }

      const status = await request(`/borrowers/${borrowerId}/admin-fee-status`, {
        token: awaitingToken,
      });
      expect(status).toBe(200);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it('blocks auditors without admin fee permissions', async () => {
    const token = buildToken(USER_ROLE.AUDITOR, 'user-auditor');
    const status = await request('/borrowers/borrower-001/admin-fee-status', { token });
    expect(status).toBe(403);
  });
});
