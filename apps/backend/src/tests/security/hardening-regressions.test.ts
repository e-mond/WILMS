import { describe, expect, it } from 'vitest';
import { createApp } from '../../http/app.js';

async function requestJson(
  method: string,
  path: string,
  options: { body?: unknown; token?: string; headers?: Record<string, string> } = {},
): Promise<{ status: number; body: Record<string, unknown> | null }> {
  const app = createApp();
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;

  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    };
    if (options.token) {
      headers.Authorization = `Bearer ${options.token}`;
    }

    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    return { status: response.status, body: payload };
  } finally {
    server.close();
  }
}

async function login(email: string, password: string): Promise<string> {
  const response = await requestJson('POST', '/auth/login', {
    body: { email, password },
  });
  expect(response.status).toBe(200);
  const token = (response.body?.data as { token?: string } | undefined)?.token;
  if (!token) {
    throw new Error('missing token');
  }
  return token;
}

describe('v1.3.8 security hardening regressions', () => {
  it('blocks collectors from creating admin message threads as another admin', async () => {
    const token = await login('collector@wilms.demo', 'DemoCollect1!');
    const response = await requestJson('POST', '/messages/threads', {
      token,
      body: { collectorId: 'user-collector', adminId: 'user-super-admin' },
    });
    expect([401, 403]).toContain(response.status);
  });

  it('blocks unauthenticated generic mail webhook updates', async () => {
    const response = await requestJson('POST', '/webhooks/mail/generic', {
      body: { messageId: 'msg-1', event: 'delivered' },
    });
    expect([401, 503]).toContain(response.status);
  });

  it('requires permission to send outbound notifications', async () => {
    const token = await login('collector@wilms.demo', 'DemoCollect1!');
    const response = await requestJson('POST', '/notifications', {
      token,
      body: {
        channel: 'EMAIL',
        recipientEmail: 'victim@example.com',
        subject: 'x',
        body: 'y',
      },
    });
    expect(response.status).toBe(403);
  });
});
