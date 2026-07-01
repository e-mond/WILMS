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
  const email = process.env.WILMS_SMOKE_EMAIL ?? 'admin@wilms.demo';
  const password = process.env.WILMS_SMOKE_PASSWORD ?? 'DemoAdmin1!';

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
    data?: { status?: string; database?: { connected?: boolean } };
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
    migrations?: { expected?: number; applied?: number | null; status?: string };
    runtime?: { nodeVersion?: string; deployedAt?: string | null; buildId?: string | null };
  } | undefined;

  record(
    'api-health-version',
    typeof healthData?.version === 'string' && healthData.version.length > 0,
    `version=${healthData?.version ?? 'missing'}`,
  );
  record(
    'api-health-migrations',
    healthData?.migrations?.status === 'ok' && healthData.migrations.applied === healthData.migrations.expected,
    `expected=${healthData?.migrations?.expected ?? '?'} applied=${healthData?.migrations?.applied ?? '?'} status=${healthData?.migrations?.status ?? 'unknown'}`,
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

  const reportsHubRes = await fetch(`${appUrl}/api/wilms/reports/hub`, {
    headers: authHeaders,
  });
  const reportsHubBody = (await reportsHubRes.json()) as {
    data?: { categoryBreakdown?: unknown[]; scheduledReports?: unknown[] };
  };
  record(
    'bff-proxy-reports-hub-shape',
    reportsHubRes.status === 200 &&
      Array.isArray(reportsHubBody.data?.categoryBreakdown) &&
      Array.isArray(reportsHubBody.data?.scheduledReports),
    `status=${reportsHubRes.status} categories=${reportsHubBody.data?.categoryBreakdown?.length ?? 'missing'}`,
  );

  const publicRegionsRes = await fetch(`${appUrl}/api/wilms/locations/regions`);
  record('public-bff-locations-regions', publicRegionsRes.status === 200, `status=${publicRegionsRes.status}`);

  const officerEmail = process.env.WILMS_SMOKE_OFFICER_EMAIL;
  const officerPassword = process.env.WILMS_SMOKE_OFFICER_PASSWORD;

  if (officerEmail && officerPassword) {
    const officerLoginRes = await fetch(`${appUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: cookieHeader(csrfCookies),
        [CSRF_HEADER]: csrfCookies.wilms_csrf ?? '',
      },
      body: JSON.stringify({ email: officerEmail, password: officerPassword }),
    });
    const officerCookies = { ...csrfCookies, ...parseSetCookies(officerLoginRes.headers) };
    record('officer-bff-login', officerLoginRes.status === 200, `status=${officerLoginRes.status}`);

    const officerHeaders: Record<string, string> = {
      cookie: cookieHeader(officerCookies),
      [CSRF_HEADER]: officerCookies.wilms_csrf ?? csrfCookies.wilms_csrf ?? '',
    };

    const officerRegionsRes = await fetch(`${appUrl}/api/wilms/locations/regions`, {
      headers: officerHeaders,
    });
    record('officer-bff-locations-regions', officerRegionsRes.status === 200, `status=${officerRegionsRes.status}`);

    const unreadRes = await fetch(`${appUrl}/api/wilms/notifications/inbox/unread-count`, {
      headers: officerHeaders,
    });
    record(
      'officer-bff-notifications-unread-count',
      unreadRes.status === 200 || unreadRes.status === 403,
      `status=${unreadRes.status}`,
    );
  } else {
    record('officer-smoke-skipped', true, 'set WILMS_SMOKE_OFFICER_EMAIL and WILMS_SMOKE_OFFICER_PASSWORD to enable');
  }

  // Mock flag — cannot read Vercel env from here; verify HTML has no demo banner text
  const homeHtml = await (await fetch(`${appUrl}/login`)).text();
  record(
    'no-demo-banner-on-login',
    !/demo mode/i.test(homeHtml),
    'demo banner absent',
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
