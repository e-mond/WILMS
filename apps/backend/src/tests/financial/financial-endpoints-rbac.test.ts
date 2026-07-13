import { describe, expect, it } from 'vitest';
import { USER_ROLE } from '@wilms/shared-rbac';
import { createApp } from '../../http/app.js';
import { encodeSessionToken } from '../../middleware/authenticate.js';

function buildToken(role: string, userId: string): string {
  return encodeSessionToken({
    userId,
    role: role as never,
    expiresAt: Date.now() + 60_000,
  });
}

async function requestStatus(
  path: string,
  options: { method?: string; token?: string } = {},
): Promise<number> {
  const app = createApp();
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;

  try {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
    });
    return response.status;
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

/**
 * v1.3.7 financial permission audit — documents expected RBAC for money-moving endpoints.
 * Authorized roles must never receive false 403; downstream 404/503 are acceptable without DB.
 */
describe('financial endpoints RBAC audit', () => {
  const collectorToken = buildToken(USER_ROLE.COLLECTOR, 'collector-fin-audit');
  const superAdminToken = buildToken(USER_ROLE.SUPER_ADMIN, 'super-admin-fin-audit');
  const auditorToken = buildToken(USER_ROLE.AUDITOR, 'auditor-fin-audit');
  const officerToken = buildToken(USER_ROLE.REGISTRATION_OFFICER, 'officer-fin-audit');

  it('allows collectors to access admin-fee queue and status endpoints', async () => {
    expect(await requestStatus('/borrowers/awaiting-admin-fee', { token: collectorToken })).not.toBe(403);
    expect(await requestStatus('/borrowers/borrower-001/admin-fee-status', { token: collectorToken })).not.toBe(
      403,
    );
  });

  it('allows collectors to access collection and reconciliation endpoints', async () => {
    expect(await requestStatus('/reconciliation', { token: collectorToken })).not.toBe(403);
    expect(await requestStatus('/reconciliations', { token: collectorToken })).not.toBe(403);
    expect(await requestStatus('/collector/collector-fin-audit/dashboard', { token: collectorToken })).not.toBe(
      403,
    );
  });

  it('allows super admins to review reconciliations and blocks collectors from review', async () => {
    expect(
      await requestStatus('/reconciliations/recon-audit/review', {
        method: 'PATCH',
        token: superAdminToken,
      }),
    ).not.toBe(403);
    expect(
      await requestStatus('/reconciliations/recon-audit/review', {
        method: 'PATCH',
        token: collectorToken,
      }),
    ).toBe(403);
  });

  it('blocks collectors from executive dashboard and expense management', async () => {
    expect(await requestStatus('/dashboard/summary', { token: collectorToken })).toBe(403);
    expect(await requestStatus('/expenses', { token: collectorToken })).toBe(403);
    expect(await requestStatus('/expenses/summary', { token: collectorToken })).toBe(403);
  });

  it('allows super admins to access executive financial dashboard', async () => {
    expect(await requestStatus('/dashboard/summary', { token: superAdminToken })).not.toBe(403);
    expect(await requestStatus('/loan-pools', { token: superAdminToken })).not.toBe(403);
    expect(await requestStatus('/expenses/summary', { token: superAdminToken })).not.toBe(403);
  });

  it('allows auditors to access read-only financial reports', async () => {
    expect(await requestStatus('/reports', { token: auditorToken })).not.toBe(403);
    expect(await requestStatus('/reports/financial-ledger', { token: auditorToken })).not.toBe(403);
    expect(await requestStatus('/analytics/collections', { token: auditorToken })).not.toBe(403);
  });

  it('blocks registration officers from financial mutation endpoints', async () => {
    expect(await requestStatus('/borrowers/awaiting-admin-fee', { token: officerToken })).toBe(403);
    expect(await requestStatus('/transactions/admin-fee', { method: 'POST', token: officerToken })).toBe(403);
    expect(await requestStatus('/dashboard/summary', { token: officerToken })).toBe(403);
  });
});
