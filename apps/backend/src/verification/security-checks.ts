/**
 * P14.3A.1 / P14.3B Pre-5B — Security verification via HTTP.
 */
import { USER_ROLE } from '@wilms/shared-rbac';
import { eq } from 'drizzle-orm';
import { createApp } from '../http/app.js';
import { isDatabaseEnabled, getDb } from '../db/client.js';
import { users } from '../db/schema/users.js';
import { encodeSessionToken } from '../middleware/authenticate.js';
import type { VerificationResult } from './unit-checks.js';

const DEMO_AUDITOR_EMAIL = 'auditor@wilms.demo';
const DEMO_COLLECTOR_EMAIL = 'collector@wilms.demo';
const DEMO_OFFICER_EMAIL = 'officer@wilms.demo';
const DEMO_APPROVER_EMAIL = 'approver@wilms.demo';

function buildSession(role: string, userId: string): string {
  return encodeSessionToken({
    userId,
    role: role as never,
    expiresAt: Date.now() + 60_000,
  });
}

async function resolveDemoUserId(email: string): Promise<string | null> {
  if (!isDatabaseEnabled()) {
    return null;
  }
  const db = getDb();
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return row?.id ?? null;
}

async function buildDemoSession(role: string, email: string, fallbackUserId: string): Promise<string> {
  const userId = (await resolveDemoUserId(email)) ?? fallbackUserId;
  return buildSession(role, userId);
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

function buildForgedUnsignedToken(): string {
  const payload = Buffer.from(
    JSON.stringify({
      userId: 'forged-user',
      role: USER_ROLE.SUPER_ADMIN,
      expiresAt: Date.now() + 60_000,
    }),
    'utf8',
  )
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return payload;
}

export async function runSecurityChecks(): Promise<VerificationResult[]> {
  const app = createApp();
  const results: VerificationResult[] = [];

  const collectorToken = await buildDemoSession(USER_ROLE.COLLECTOR, DEMO_COLLECTOR_EMAIL, 'collector-user');
  const officerToken = await buildDemoSession(
    USER_ROLE.REGISTRATION_OFFICER,
    DEMO_OFFICER_EMAIL,
    'officer-user',
  );
  const approverToken = await buildDemoSession(USER_ROLE.APPROVER, DEMO_APPROVER_EMAIL, 'approver-user');
  const auditorToken = await buildDemoSession(USER_ROLE.AUDITOR, DEMO_AUDITOR_EMAIL, 'auditor-user');

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

  const forgedToken = buildForgedUnsignedToken();
  const forged = await request(app, '/loans', { token: forgedToken });
  results.push({
    name: 'unsigned-forged-token-blocked',
    passed: forged.status === 401,
    detail: `status ${forged.status}`,
  });

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

  const auditSpoof = await request(app, '/audit', {
    method: 'POST',
    token: collectorToken,
    body: {
      action: 'payment.recorded',
      actorId: 'other-user',
      targetEntityId: 'fake-payment',
      targetEntityType: 'payment',
    },
  });
  results.push({
    name: 'collector-cannot-post-audit',
    passed: auditSpoof.status === 403,
    detail: `status ${auditSpoof.status}`,
  });

  const auditorAudit = await request(app, '/audit', {
    method: 'POST',
    token: auditorToken,
    body: {
      action: 'settings.exported',
      targetEntityId: 'settings',
      targetEntityType: 'settings',
    },
  });
  results.push({
    name: 'auditor-can-post-audit',
    passed: auditorAudit.status === 201,
    detail: `status ${auditorAudit.status}`,
  });

  let rateLimitTriggered = false;
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const loginAttempt = await request(app, '/auth/login', {
      method: 'POST',
      body: { email: 'nobody@wilms.demo', password: 'wrong-password' },
    });

    if (loginAttempt.status === 429) {
      rateLimitTriggered = true;
      break;
    }
  }

  results.push({
    name: 'login-rate-limit-triggered',
    passed: rateLimitTriggered,
    detail: rateLimitTriggered ? '429 received' : 'no 429 within 25 attempts',
  });

  return results;
}
