import { describe, expect, it } from 'vitest';
import { USER_ROLE } from '@wilms/shared-rbac';
import { createApp } from '../../http/app.js';
import { encodeSessionToken } from '../../middleware/authenticate.js';

const COLLECTOR_ID = 'collector-user-1';
const OTHER_COLLECTOR_ID = 'collector-user-2';

function buildSession(role: string, userId: string): string {
  return encodeSessionToken({
    userId,
    role: role as never,
    expiresAt: Date.now() + 60_000,
  });
}

async function request(
  path: string,
  options: { method?: string; token?: string; body?: unknown } = {},
): Promise<{ status: number; body: unknown }> {
  const app = createApp();
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;

  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (options.token) {
      headers.Authorization = `Bearer ${options.token}`;
    }
    if (options.body) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    return { status: response.status, body };
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

describe('collector portal RBAC', () => {
  it('allows collectors to load their own dashboard', async () => {
    const token = buildSession(USER_ROLE.COLLECTOR, COLLECTOR_ID);
    const response = await request(`/collector/${COLLECTOR_ID}/dashboard`, { token });

    expect(response.status).toBe(200);
  });

  it('blocks collectors from loading another collector dashboard', async () => {
    const token = buildSession(USER_ROLE.COLLECTOR, COLLECTOR_ID);
    const response = await request(`/collector/${OTHER_COLLECTOR_ID}/dashboard`, { token });

    expect(response.status).toBe(403);
  });

  it('blocks registration officers from collector dashboards', async () => {
    const token = buildSession(USER_ROLE.REGISTRATION_OFFICER, 'officer-user');
    const response = await request(`/collector/${COLLECTOR_ID}/dashboard`, { token });

    expect(response.status).toBe(403);
  });

  it('allows collectors to read notification unread count', async () => {
    const token = buildSession(USER_ROLE.COLLECTOR, COLLECTOR_ID);
    const response = await request('/notifications/inbox/unread-count', { token });

    expect(response.status).toBe(200);
  });

  it('allows collectors to create capture sessions', async () => {
    const token = buildSession(USER_ROLE.COLLECTOR, COLLECTOR_ID);
    const response = await request('/registration/capture-sessions', {
      method: 'POST',
      token,
      body: {
        registrationSessionId: 'reg-session-1',
        officerId: COLLECTOR_ID,
        target: 'borrower',
      },
    });

    expect(response.status).toBe(201);
  });

  it('blocks collectors from disbursement eligibility checks', async () => {
    const token = buildSession(USER_ROLE.COLLECTOR, COLLECTOR_ID);
    const response = await request('/borrowers/borrower-1/disbursement-eligibility', { token });

    expect(response.status).toBe(403);
  });
});
