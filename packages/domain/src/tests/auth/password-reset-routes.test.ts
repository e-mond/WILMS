import { describe, expect, it } from 'vitest';
import { createApp } from '../../http/app.js';

async function postJson(
  path: string,
  body: unknown,
): Promise<{ status: number; body: unknown }> {
  const app = createApp();
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;

  try {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const payload = await response.json().catch(() => null);
    return { status: response.status, body: payload };
  } finally {
    server.close();
  }
}

describe('POST /auth/forgot-password', () => {
  it('returns success without revealing whether the email exists', async () => {
    const response = await postJson('/auth/forgot-password', {
      email: 'unknown-user@example.com',
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { ok: true } });
  });

  it('rejects missing email with validation error', async () => {
    const response = await postJson('/auth/forgot-password', { email: '' });

    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({
      error: {
        code: 'VALIDATION',
      },
    });
  });
});

describe('POST /auth/reset-password', () => {
  it('rejects invalid tokens', async () => {
    const response = await postJson('/auth/reset-password', {
      token: 'invalid-token',
      newPassword: 'NewPassword1!',
    });

    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({
      error: {
        message: expect.stringContaining('Invalid or expired'),
      },
    });
  });

  it('rejects short passwords', async () => {
    const response = await postJson('/auth/reset-password', {
      token: 'some-token',
      newPassword: 'short',
    });

    expect(response.status).toBe(422);
  });
});
