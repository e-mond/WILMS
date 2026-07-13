/**
 * RC1.1 — Role-scoped production RBAC smoke (via BFF).
 *
 * Usage:
 *   WILMS_APP_URL=https://wilms.vercel.app npm run smoke:rbac -w @wilms/api
 */
import '../config/load-env.js';
import { resolveRoleSmokeCredential } from './smoke-credentials.js';

interface SmokeCheck {
  name: string;
  pass: boolean;
  detail: string;
}

const checks: SmokeCheck[] = [];
const CSRF_HEADER = 'x-wilms-csrf';

function record(name: string, pass: boolean, detail: string): void {
  checks.push({ name, pass, detail });
  console.log(`  ${pass ? '✓' : '✗'} ${name}: ${detail}`);
}

function parseSetCookies(headers: Headers): Record<string, string> {
  const cookies: Record<string, string> = {};
  const raw =
    typeof headers.getSetCookie === 'function'
      ? headers.getSetCookie()
      : [headers.get('set-cookie')].filter(Boolean) as string[];
  for (const header of raw) {
    const match = header.match(/^([^=]+)=([^;]+)/);
    if (match?.[1] && match[2]) cookies[match[1]] = match[2];
  }
  return cookies;
}

function cookieHeader(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

async function bffLogin(
  appUrl: string,
  email: string,
  password: string,
): Promise<{ ok: boolean; cookies: Record<string, string>; userId?: string }> {
  const csrfRes = await fetch(`${appUrl}/api/auth/csrf`);
  const csrfCookies = parseSetCookies(csrfRes.headers);
  const loginRes = await fetch(`${appUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: cookieHeader(csrfCookies),
      [CSRF_HEADER]: csrfCookies.wilms_csrf ?? '',
    },
    body: JSON.stringify({ email, password }),
  });
  const loginCookies = { ...csrfCookies, ...parseSetCookies(loginRes.headers) };
  const body = (await loginRes.json()) as { user?: { id: string } };
  return {
    ok: loginRes.status === 200,
    cookies: loginCookies,
    userId: body.user?.id,
  };
}

async function bffGet(
  appUrl: string,
  path: string,
  cookies: Record<string, string>,
): Promise<number> {
  const res = await fetch(`${appUrl}/api/wilms${path}`, {
    headers: {
      cookie: cookieHeader(cookies),
      [CSRF_HEADER]: cookies.wilms_csrf ?? '',
    },
  });
  return res.status;
}

async function main(): Promise<void> {
  const appUrl = (process.env.WILMS_APP_URL ?? 'https://wilms.vercel.app').replace(/\/$/, '');

  console.log('RC1.1 RBAC Production Smoke');
  console.log(`APP: ${appUrl}`);

  const adminCreds = resolveRoleSmokeCredential(appUrl, {
    label: 'admin',
    emailEnv: 'WILMS_SMOKE_EMAIL',
    passwordEnv: 'WILMS_SMOKE_PASSWORD',
    fallbackEmail: 'admin@wilms.demo',
    fallbackPassword: 'DemoAdmin1!',
  });
  const admin = await bffLogin(appUrl, adminCreds.email, adminCreds.password);
  record('admin-login', admin.ok, admin.ok ? 'ok' : 'failed');

  if (admin.ok) {
    record(
      'admin-dashboard-summary',
      (await bffGet(appUrl, '/dashboard/summary', admin.cookies)) === 200,
      'expect 200',
    );
    record(
      'admin-settings-users',
      (await bffGet(appUrl, '/settings/users', admin.cookies)) === 200,
      'expect 200',
    );
    record(
      'admin-collectors',
      (await bffGet(appUrl, '/collectors', admin.cookies)) === 200,
      'expect 200',
    );
  }

  const collectorCreds = resolveRoleSmokeCredential(appUrl, {
    label: 'collector',
    emailEnv: 'WILMS_SMOKE_COLLECTOR_EMAIL',
    passwordEnv: 'WILMS_SMOKE_COLLECTOR_PASSWORD',
    fallbackEmail: 'collector@wilms.demo',
    fallbackPassword: 'DemoCollect1!',
  });
  const collector = await bffLogin(appUrl, collectorCreds.email, collectorCreds.password);
  record('collector-login', collector.ok, collector.ok ? 'ok' : 'failed');

  if (collector.ok && collector.userId) {
    record(
      'collector-own-dashboard',
      (await bffGet(appUrl, `/collector/${collector.userId}/dashboard`, collector.cookies)) === 200,
      'expect 200',
    );
    record(
      'collector-blocked-admin-dashboard',
      (await bffGet(appUrl, '/dashboard/summary', collector.cookies)) === 403,
      'expect 403',
    );
    record(
      'collector-blocked-settings-users',
      (await bffGet(appUrl, '/settings/users', collector.cookies)) === 403,
      'expect 403',
    );
    record(
      'collector-reconciliation',
      (await bffGet(appUrl, `/reconciliations?collectorId=${collector.userId}`, collector.cookies)) === 200,
      'expect 200',
    );
  }

  const officerCreds = resolveRoleSmokeCredential(appUrl, {
    label: 'officer',
    emailEnv: 'WILMS_SMOKE_OFFICER_EMAIL',
    passwordEnv: 'WILMS_SMOKE_OFFICER_PASSWORD',
    fallbackEmail: 'officer@wilms.demo',
    fallbackPassword: 'DemoOfficer1!',
  });
  const officer = await bffLogin(appUrl, officerCreds.email, officerCreds.password);
  record('officer-login', officer.ok, officer.ok ? 'ok' : 'failed');

  if (officer.ok) {
    record(
      'officer-blocked-dashboard',
      (await bffGet(appUrl, '/dashboard/summary', officer.cookies)) === 403,
      'expect 403',
    );
  }

  const passed = checks.filter((c) => c.pass).length;
  console.log(`\nPassed: ${passed}/${checks.length}`);
  if (passed !== checks.length) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
