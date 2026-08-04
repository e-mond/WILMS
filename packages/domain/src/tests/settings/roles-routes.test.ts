import { describe, expect, it } from 'vitest';
import { createApp } from '../../http/app.js';

async function requestJson(
  method: string,
  path: string,
  options: { body?: unknown; token?: string } = {},
): Promise<{ status: number; body: Record<string, unknown> | null }> {
  const app = createApp();
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;

  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
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

async function loginAsAdmin(): Promise<string> {
  const response = await requestJson('POST', '/auth/login', {
    body: { email: 'admin@wilms.demo', password: 'DemoAdmin1!' },
  });

  expect(response.status).toBe(200);
  const data = response.body?.data as { token?: string } | undefined;
  if (!data?.token) {
    throw new Error('Missing login token');
  }

  return data.token;
}

describe('settings role routes', () => {
  it('clones a role with a unique name', async () => {
    const token = await loginAsAdmin();

    const first = await requestJson('POST', '/settings/roles/role-collector/clone', {
      token,
      body: {},
    });

    expect(first.status).toBe(201);
    expect((first.body?.data as { name?: string } | undefined)?.name).toBe('Collector Copy');

    const second = await requestJson('POST', '/settings/roles/role-collector/clone', {
      token,
      body: {},
    });

    expect(second.status).toBe(201);
    expect((second.body?.data as { name?: string } | undefined)?.name).toBe('Collector Copy 2');
  });

  it('deletes a cloned role', async () => {
    const token = await loginAsAdmin();

    const cloned = await requestJson('POST', '/settings/roles/role-collector/clone', {
      token,
      body: {},
    });

    const roleId = (cloned.body?.data as { id?: string } | undefined)?.id;
    expect(roleId).toBeTruthy();

    const deleted = await requestJson('POST', `/settings/roles/${roleId}/delete`, {
      token,
      body: {},
    });

    expect(deleted.status).toBe(200);
    expect((deleted.body?.data as { ok?: boolean } | undefined)?.ok).toBe(true);
  });

  it('returns 404 when deleting a missing role', async () => {
    const token = await loginAsAdmin();

    const response = await requestJson('POST', '/settings/roles/role-does-not-exist/delete', {
      token,
      body: {},
    });

    expect(response.status).toBe(404);
  });
});
