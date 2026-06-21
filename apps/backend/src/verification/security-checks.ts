/**
 * P14.3A.1 — Security verification via HTTP (no DATABASE_URL required for auth/RBAC).
 */
import { createApp } from '../http/app.js';
import { encodeSessionToken } from '../middleware/authenticate.js';
import { USER_ROLE } from '@wilms/shared-rbac';
import type { VerificationResult } from './unit-checks.js';

function buildSession(role: string, userId: string): string {
  return encodeSessionToken({
    userId,
    role: role as never,
    expiresAt: Date.now() + 60_000,
  });
}

async function request(
  app: ReturnType<typeof createApp>,
  path: string,
  options: { method?: string; token?: string; body?: unknown } = {},
): Promise<{ status: number; body: unknown }> {
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

export async function runSecurityChecks(): Promise<VerificationResult[]> {
  const app = createApp();
  const results: VerificationResult[] = [];

  const unauthenticated = await request(app, '/loans');
  results.push({
    name: 'unauthenticated-loans-blocked',
    passed: unauthenticated.status === 401,
    detail: `status ${unauthenticated.status}`,
  });

  const expiredToken = encodeSessionToken({
    userId: 'expired-user',
    role: USER_ROLE.COLLECTOR,
    expiresAt: Date.now() - 1000,
  });
  const expired = await request(app, '/loans', { token: expiredToken });
  results.push({
    name: 'expired-session-blocked',
    passed: expired.status === 401,
    detail: `status ${expired.status}`,
  });

  const collectorToken = buildSession(USER_ROLE.COLLECTOR, 'collector-user');
  const collectorApprove = await request(app, '/loans/01930002-0001-7000-8000-000000000003/approve', {
    method: 'PATCH',
    token: collectorToken,
  });
  results.push({
    name: 'collector-cannot-approve-loan',
    passed: collectorApprove.status === 403,
    detail: `status ${collectorApprove.status}`,
  });

  const collectorDisburse = await request(app, '/loans/01930002-0001-7000-8000-000000000003/disburse', {
    method: 'POST',
    token: collectorToken,
  });
  results.push({
    name: 'collector-cannot-disburse',
    passed: collectorDisburse.status === 403,
    detail: `status ${collectorDisburse.status}`,
  });

  const officerToken = buildSession(USER_ROLE.REGISTRATION_OFFICER, 'officer-user');
  const officerPayment = await request(app, '/payments', {
    method: 'POST',
    token: officerToken,
    body: {
      borrowerId: 'x',
      amountPesewas: 100,
      paymentDate: '2026-01-01',
      collectorId: 'y',
    },
  });
  results.push({
    name: 'officer-cannot-post-payment',
    passed: officerPayment.status === 403,
    detail: `status ${officerPayment.status}`,
  });

  const approverToken = buildSession(USER_ROLE.APPROVER, 'approver-user');
  const invalidBody = await request(app, '/loans', {
    method: 'POST',
    token: approverToken,
    body: { borrowerId: '', amountPesewas: -1 },
  });
  results.push({
    name: 'malformed-loan-create-rejected',
    passed: invalidBody.status === 422,
    detail: `status ${invalidBody.status}`,
  });

  const collectorReverse = await request(app, '/payments/01930002-0001-7000-8000-000000000099/reverse', {
    method: 'POST',
    token: collectorToken,
    body: {
      reason: 'Collector should not reverse payments',
      actorId: 'collector-user',
      actorDisplayName: 'Collector',
    },
  });
  results.push({
    name: 'collector-cannot-reverse-payment',
    passed: collectorReverse.status === 403,
    detail: `status ${collectorReverse.status}`,
  });

  return results;
}
