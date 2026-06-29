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

  // Frontend login page
  const loginPage = await fetch(`${appUrl}/login`);
  record('frontend-login-page', loginPage.status === 200, `status=${loginPage.status}`);

  // BFF login
  const loginRes = await fetch(`${appUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const setCookie = loginRes.headers.get('set-cookie') ?? '';
  record('bff-login', loginRes.status === 200, `status=${loginRes.status}`);
  record(
    'session-cookie-httponly',
    /wilms_session=/i.test(setCookie) && /httponly/i.test(setCookie),
    setCookie ? 'cookie present' : 'no set-cookie',
  );

  const loginBody = (await loginRes.json()) as { user?: { id: string }; expiresAt?: number };
  const setCookieHeader = loginRes.headers.get('set-cookie') ?? '';
  const sessionCookie = setCookieHeader.match(/wilms_session=([^;]+)/i)?.[1];
  record(
    'login-session',
    loginRes.status === 200 && Boolean(loginBody.user?.id || sessionCookie),
    sessionCookie ? 'session cookie set' : loginBody.user?.id ? 'user in body' : 'missing',
  );

  const authHeaders: Record<string, string> = {};
  if (sessionCookie) {
    authHeaders.cookie = `wilms_session=${sessionCookie}`;
  }

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
