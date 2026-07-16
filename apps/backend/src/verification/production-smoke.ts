/**
 * P14.5D — Production smoke test (automated).
 *
 * Usage:
 *   WILMS_APP_URL=https://app.example.com \
 *   WILMS_API_URL=https://api.example.com \
 *   WILMS_SMOKE_EMAIL=admin@wilms.demo \
 *   WILMS_SMOKE_PASSWORD=... \
 *   npm run smoke:production -w @wilms/api
 *
 * WILMS_APP_URL — Vercel frontend (BFF at /api/wilms)
 * WILMS_API_URL — Railway Express (direct /health, optional RBAC probes)
 */
import '../config/load-env.js';
import { resolveSmokeCredentials } from './smoke-credentials.js';

interface SmokeCheck {
  name: string;
  pass: boolean;
  detail: string;
}

const checks: SmokeCheck[] = [];

function record(name: string, pass: boolean, detail: string): void {
  checks.push({ name, pass, detail });
  const mark = pass ? '✓' : '✗';
  console.log(`  ${mark} ${name}: ${detail}`);
}

function parseSetCookies(headers: Headers): Record<string, string> {
  const cookies: Record<string, string> = {};
  const raw =
    typeof headers.getSetCookie === 'function'
      ? headers.getSetCookie()
      : [headers.get('set-cookie')].filter(Boolean) as string[];

  for (const header of raw) {
    const match = header.match(/^([^=]+)=([^;]+)/);
    if (match?.[1] && match[2]) {
      cookies[match[1]] = match[2];
    }
  }

  return cookies;
}

function cookieHeader(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

const CSRF_HEADER = 'x-wilms-csrf';

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required for production smoke tests`);
  }
  return value.replace(/\/$/, '');
}

async function main(): Promise<void> {
  const appUrl = requireEnv('WILMS_APP_URL');
  const apiUrl = requireEnv('WILMS_API_URL');
  const { email, password } = resolveSmokeCredentials(appUrl);

  console.log('P14.5D Production Smoke Tests');
  console.log(`Started: ${new Date().toISOString()}`);
  console.log(`APP: ${appUrl}`);
  console.log(`API: ${apiUrl}`);

  // No localhost in configured URLs
  for (const [label, url] of [
    ['WILMS_APP_URL', appUrl],
    ['WILMS_API_URL', apiUrl],
  ] as const) {
    const local =
      url.includes('127.0.0.1') || url.includes('localhost') || url.startsWith('http://');
    record(`${label}-not-localhost`, !local, local ? `unsafe url ${url}` : 'ok');
  }

  // API health
  const healthRes = await fetch(`${apiUrl}/health`);
  const healthEnvelope = (await healthRes.json()) as {
    data?: {
      status?: string;
      database?: { connected?: boolean };
      schema?: { status?: string };
    };
  };
  const healthJson = healthEnvelope.data ?? {};
  record(
    'api-health-status',
    healthRes.status === 200 && healthJson.status === 'ok',
    `http=${healthRes.status} status=${healthJson.status ?? 'unknown'}`,
  );
  record(
    'api-health-database',
    healthJson.database?.connected === true,
    `connected=${String(healthJson.database?.connected)}`,
  );

  const healthData = healthEnvelope.data as {
    version?: string;
    gitCommit?: string | null;
    uptimeSeconds?: number;
    environment?: string;
    status?: string;
    migrations?: { expected?: number; applied?: number | null; status?: string };
    schema?: { status?: string; missingTables?: string[] };
    runtime?: { nodeVersion?: string; deployedAt?: string | null; buildId?: string | null };
  } | undefined;

  record(
    'api-health-gitCommit',
    Boolean(healthData?.gitCommit?.trim()),
    `gitCommit=${healthData?.gitCommit ?? 'null'}`,
  );

  const expectedGitCommit = process.env.WILMS_EXPECTED_GIT_COMMIT?.trim();
  if (expectedGitCommit) {
    const actual = healthData?.gitCommit?.trim().toLowerCase() ?? '';
    const expected = expectedGitCommit.toLowerCase();
    const matches =
      actual === expected || actual.startsWith(expected) || expected.startsWith(actual);
    record('api-health-gitCommit-expected', matches, `expected=${expectedGitCommit.slice(0, 12)}…`);
  }

  record(
    'api-health-schema',
    healthData?.schema?.status === 'ok',
    `schema=${healthData?.schema?.status ?? 'missing'} missing=${healthData?.schema?.missingTables?.length ?? '?'}`,
  );

  record(
    'api-health-version',
    typeof healthData?.version === 'string' && healthData.version.length > 0,
    `version=${healthData?.version ?? 'missing'}`,
  );
  record(
    'api-health-migrations',
    healthData?.migrations?.status === 'ok',
    `expected=${healthData?.migrations?.expected ?? '?'} applied=${healthData?.migrations?.applied ?? '?'} status=${healthData?.migrations?.status ?? 'unknown'} (drizzle uses watermark, not row count)`,
  );
  record(
    'api-health-runtime',
    Boolean(healthData?.runtime?.nodeVersion),
    `node=${healthData?.runtime?.nodeVersion ?? 'missing'} uptime=${healthData?.uptimeSeconds ?? '?'}s env=${healthData?.environment ?? '?'}`,
  );

  // Frontend login page
  const loginPage = await fetch(`${appUrl}/login`);
  record('frontend-login-page', loginPage.status === 200, `status=${loginPage.status}`);

  // CSRF token issuance
  const csrfRes = await fetch(`${appUrl}/api/auth/csrf`, { credentials: 'include' });
  const csrfCookies = parseSetCookies(csrfRes.headers);
  record(
    'csrf-token-issued',
    csrfRes.status === 200 && Boolean(csrfCookies.wilms_csrf),
    csrfRes.status === 200 ? 'token cookie set' : `status=${csrfRes.status}`,
  );

  // Login without CSRF must fail
  const loginNoCsrfRes = await fetch(`${appUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  record('csrf-blocks-login-without-token', loginNoCsrfRes.status === 403, `status=${loginNoCsrfRes.status}`);

  // BFF login with CSRF
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
  const setCookie = loginRes.headers.get('set-cookie') ?? '';
  record('bff-login', loginRes.status === 200, `status=${loginRes.status}`);
  record(
    'session-cookie-httponly',
    /wilms_session=/i.test(setCookie) && /httponly/i.test(setCookie),
    setCookie ? 'cookie present' : 'no set-cookie',
  );

  const loginBody = (await loginRes.json()) as { user?: { id: string }; expiresAt?: number };
  const sessionCookie = loginCookies.wilms_session;
  record(
    'login-session',
    loginRes.status === 200 && Boolean(loginBody.user?.id || sessionCookie),
    sessionCookie ? 'session cookie set' : loginBody.user?.id ? 'user in body' : 'missing',
  );

  const authHeaders: Record<string, string> = {
    cookie: cookieHeader(loginCookies),
    [CSRF_HEADER]: loginCookies.wilms_csrf ?? csrfCookies.wilms_csrf ?? '',
  };

  // BFF proxy — loans list (admin)
  const loansRes = await fetch(`${appUrl}/api/wilms/loans?status=ACTIVE`, {
    headers: authHeaders,
  });
  record('bff-proxy-loans', loansRes.status === 200, `status=${loansRes.status}`);

  // RBAC — unauthenticated
  const unauthRes = await fetch(`${apiUrl}/loans`);
  record('rbac-unauthenticated-api', unauthRes.status === 401, `status=${unauthRes.status}`);

  // Reports hub via BFF
  const reportsRes = await fetch(`${appUrl}/api/wilms/reports`, {
    headers: authHeaders,
  });
  record('bff-proxy-reports', reportsRes.status === 200, `status=${reportsRes.status}`);

  // RC1 Phase 2 — high-traffic BFF routes
  for (const [name, path] of [
    ['bff-proxy-settings-me', '/settings/me'],
    ['bff-proxy-dashboard', '/dashboard/summary'],
    ['bff-proxy-groups', '/groups'],
    ['bff-proxy-loan-pools', '/loan-pools'],
    ['bff-proxy-risk-flags', '/risk-flags'],
    ['bff-proxy-messages', '/messages/threads'],
    ['bff-proxy-collectors', '/collectors'],
    ['bff-proxy-borrowers', '/borrowers'],
    ['bff-proxy-loans-portfolio', '/loans/portfolio'],
    ['bff-proxy-expenses', '/expenses'],
    ['bff-proxy-reconciliations', '/reconciliations'],
    ['bff-proxy-notifications-inbox', '/notifications/inbox'],
    ['bff-proxy-audit-log', '/audit-log'],
    ['bff-proxy-search', '/search?q=test'],
  ] as const) {
    const res = await fetch(`${appUrl}/api/wilms${path}`, { headers: authHeaders });
    record(name, res.status === 200, `status=${res.status}`);
  }

  // RC1.1 — BFF responses must return parseable JSON (guards ERR_CONTENT_DECODING_FAILED)
  for (const [name, path] of [
    ['bff-encoding-dashboard', '/dashboard/summary'],
    ['bff-encoding-borrowers', '/borrowers'],
    ['bff-encoding-collectors', '/collectors'],
  ] as const) {
    const res = await fetch(`${appUrl}/api/wilms${path}`, {
      headers: { ...authHeaders, 'Accept-Encoding': 'gzip, deflate, br' },
    });
    const encoding = res.headers.get('content-encoding');
    let jsonOk = false;
    try {
      await res.clone().json();
      jsonOk = true;
    } catch {
      jsonOk = false;
    }
    record(
      name,
      res.status === 200 && jsonOk,
      `status=${res.status} encoding=${encoding ?? 'none'} json=${jsonOk ? 'ok' : 'fail'}`,
    );
  }

  // Mock flag — cannot read Vercel env from here; verify HTML has no demo banner text
  const homeHtml = await (await fetch(`${appUrl}/login`)).text();
  record(
    'no-demo-banner-on-login',
    !/demo mode/i.test(homeHtml),
    'demo banner absent',
  );

  // Photo capture — public mobile routes must not require session auth (RC1.4)
  const captureLookupRes = await fetch(
    `${appUrl}/api/wilms/photo-capture/sessions/pcs_smoke_invalid0001`,
    { cache: 'no-store' },
  );
  record(
    'bff-photo-capture-public-lookup',
    captureLookupRes.status !== 401 && captureLookupRes.status !== 403,
    `status=${captureLookupRes.status} (expect 404 or 503, not auth failure)`,
  );

  const captureUploadRes = await fetch(
    `${appUrl}/api/wilms/photo-capture/sessions/pcs_smoke_invalid0001/upload`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        purpose: 'borrower-photo',
        fileName: 'smoke.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 16,
        dataUrl: 'data:image/jpeg;base64,/9j/4AAQ',
      }),
    },
  );
  record(
    'bff-photo-capture-public-upload-no-csrf',
    captureUploadRes.status !== 401 && captureUploadRes.status !== 403,
    `status=${captureUploadRes.status} (expect 404/422/503, not auth/csrf failure)`,
  );

  const passed = checks.filter((c) => c.pass).length;
  const total = checks.length;
  console.log(`\nPassed: ${passed}/${total}`);
  console.log(`Finished: ${new Date().toISOString()}`);

  if (passed !== total) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
