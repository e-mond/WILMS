/**
 * P14.3B Phase 4C.4 — HTTP helpers for reconciliation certification.
 */
import { createApp } from '../http/app.js';

export async function withTestApp<T>(
  run: (baseUrl: string) => Promise<T>,
): Promise<T> {
  const app = createApp();
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    return await run(baseUrl);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

export async function loginViaApp(
  baseUrl: string,
  email: string,
  password: string,
): Promise<string> {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = (await response.json()) as { data?: { token?: string } };
  if (!response.ok || !json.data?.token) {
    throw new Error(`Login failed for ${email} — status ${response.status}`);
  }
  return json.data.token;
}

export async function httpJson(
  baseUrl: string,
  method: 'GET' | 'POST',
  path: string,
  token: string | undefined,
  body?: unknown,
): Promise<{ status: number; json: unknown }> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await response.json().catch(() => null);
  return { status: response.status, json };
}

export const DEMO_PASSWORDS = {
  admin: 'DemoAdmin1!',
  collector: 'DemoCollect1!',
  officer: 'DemoOfficer1!',
  auditor: 'DemoAudit1!',
} as const;
