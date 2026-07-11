import { describe, expect, it } from 'vitest';
import { createApp } from '../../http/app.js';

async function request(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<{ status: number; body: unknown }> {
  const app = createApp();
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;

  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
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

describe('photo capture public routes', () => {
  it('allows unauthenticated session lookup without 401', async () => {
    const response = await request('/api/v1/photo-capture/sessions/pcs_deadbeefdeadbeef');

    expect(response.status).not.toBe(401);
    expect([404, 503]).toContain(response.status);
  });

  it('allows unauthenticated upload attempts without 401', async () => {
    const response = await request('/api/v1/photo-capture/sessions/pcs_deadbeefdeadbeef/upload', {
      method: 'POST',
      body: {
        purpose: 'borrower-photo',
        fileName: 'test.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 128,
        dataUrl: 'data:image/jpeg;base64,/9j/4AAQ',
      },
    });

    expect(response.status).not.toBe(401);
    expect([404, 422, 503]).toContain(response.status);
  });

  it('allows unauthenticated Ghana location lookups without 401', async () => {
    const response = await request('/api/v1/locations/regions');

    expect(response.status).toBe(200);
  });
});
