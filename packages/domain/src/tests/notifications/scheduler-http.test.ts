import { describe, expect, it, beforeAll, afterAll, vi } from 'vitest';
import type { Server } from 'node:http';

const SCHEDULER_TOKEN = 'test-scheduler-token-phase32';

describe('scheduler HTTP access', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    vi.stubEnv('WILMS_SCHEDULER_TOKEN', SCHEDULER_TOKEN);
    vi.resetModules();
    await import('../../config/load-env.js');
    const { createApp } = await import('../../http/app.js');
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => resolve());
    });
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Failed to bind test server');
    }
    baseUrl = `http://127.0.0.1:${address.port}`;
  }, 60_000);

  afterAll(async () => {
    vi.unstubAllEnvs();
    if (!server) {
      return;
    }
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }, 30_000);

  it('rejects scheduler requests without valid token', async () => {
    const response = await fetch(`${baseUrl}/notifications/scheduler/run`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer wrong-token',
        'Content-Type': 'application/json',
      },
      body: '{}',
    });
    expect(response.status).toBe(401);
  });

  it(
    'accepts scheduler requests with valid WILMS_SCHEDULER_TOKEN',
    async () => {
      const response = await fetch(`${baseUrl}/notifications/scheduler/run`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SCHEDULER_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: '{}',
      });
      expect(response.status).toBe(200);
      const body = (await response.json()) as { data?: Record<string, unknown> };
      expect(body.data).toBeDefined();
    },
    60_000,
  );
});
