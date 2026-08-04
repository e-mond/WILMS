import { describe, expect, it } from 'vitest';
import { createApp } from '../../http/app.js';

/**
 * In-memory stress simulation for concurrent authenticated requests.
 * Full 1000-borrower DB stress requires DATABASE_URL (documented as blocked).
 */
async function loginAdmin(port: number): Promise<string> {
  const response = await fetch(`http://127.0.0.1:${port}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email: 'admin@wilms.demo', password: 'DemoAdmin1!' }),
  });
  const json = (await response.json()) as { data?: { token?: string } };
  if (!json.data?.token) {
    throw new Error('login failed');
  }
  return json.data.token;
}

describe('in-memory concurrency stress', () => {
  it('handles 100 concurrent authenticated health/session reads without errors', async () => {
    const app = createApp();
    const server = app.listen(0);
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;

    try {
      const token = await loginAdmin(port);
      const requests = Array.from({ length: 100 }, () =>
        fetch(`http://127.0.0.1:${port}/auth/session`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        }),
      );

      const responses = await Promise.all(requests);
      const statuses = responses.map((response) => response.status);
      expect(statuses.every((status) => status === 200)).toBe(true);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it('rejects parallel forged sessions consistently', async () => {
    const app = createApp();
    const server = app.listen(0);
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;

    try {
      const forged =
        'eyJ1c2VySWQiOiJmYWtlIiwicm9sZSI6IlNVUEVSX0FETUlOIiwiZXhwaXJlc0F0Ijo5OTk5OTk5OTk5OTk5fQ.forged';
      const requests = Array.from({ length: 50 }, () =>
        fetch(`http://127.0.0.1:${port}/api/v1/settings/roles`, {
          headers: { Authorization: `Bearer ${forged}`, Accept: 'application/json' },
        }),
      );
      const responses = await Promise.all(requests);
      expect(responses.every((response) => response.status === 401)).toBe(true);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});
