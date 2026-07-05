#!/usr/bin/env node
/** P14.6.3 read-only production verification probes */
const APP = process.env.WILMS_APP_URL ?? 'https://wilms.vercel.app';
const API = process.env.WILMS_API_URL ?? 'https://wilms-production.up.railway.app';

const USERS = [
  ['admin@wilms.demo', 'DemoAdmin1!', 'SUPER_ADMIN'],
  ['collector@wilms.demo', 'DemoCollect1!', 'COLLECTOR'],
  ['approver@wilms.demo', 'DemoApprove1!', 'APPROVER'],
  ['officer@wilms.demo', 'DemoOfficer1!', 'REGISTRATION_OFFICER'],
  ['auditor@wilms.demo', 'DemoAudit1!', 'AUDITOR'],
];

function parseCookies(headers) {
  const out = {};
  const raw =
    typeof headers.getSetCookie === 'function'
      ? headers.getSetCookie()
      : [headers.get('set-cookie')].filter(Boolean);
  for (const c of raw) {
    const m = c.match(/^([^=]+)=([^;]+)/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function cookieHeader(cookies) {
  return Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

async function main() {
  const results = [];

  const csrfRes = await fetch(`${APP}/api/auth/csrf`);
  const csrfCookies = parseCookies(csrfRes.headers);
  results.push({
    test: 'csrf',
    status: csrfRes.status,
    hasCsrfCookie: Boolean(csrfCookies.wilms_csrf),
    body: await csrfRes.text(),
  });

  const noCsrf = await fetch(`${APP}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'admin@wilms.demo', password: 'DemoAdmin1!' }),
  });
  results.push({ test: 'login-no-csrf', status: noCsrf.status, body: await noCsrf.text() });

  for (const [email, password, role] of USERS) {
    const res = await fetch(`${APP}/api/auth/login`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: cookieHeader(csrfCookies),
        'x-wilms-csrf': csrfCookies.wilms_csrf ?? '',
      },
      body: JSON.stringify({ email, password }),
    });
    const setCookie = res.headers.get('set-cookie') ?? '';
    results.push({
      test: `login-${role}`,
      status: res.status,
      hasSession: /wilms_session/i.test(setCookie),
      httponly: /httponly/i.test(setCookie),
      body: (await res.text()).slice(0, 300),
    });
  }

  const bad = await fetch(`${APP}/api/auth/login`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: cookieHeader(csrfCookies),
      'x-wilms-csrf': csrfCookies.wilms_csrf ?? '',
    },
    body: JSON.stringify({ email: 'admin@wilms.demo', password: 'WrongPassword1!' }),
  });
  results.push({ test: 'wrong-password', status: bad.status, body: await bad.text() });

  const unknown = await fetch(`${APP}/api/auth/login`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: cookieHeader(csrfCookies),
      'x-wilms-csrf': csrfCookies.wilms_csrf ?? '',
    },
    body: JSON.stringify({ email: 'nobody@wilms.demo', password: 'DemoAdmin1!' }),
  });
  results.push({ test: 'unknown-email', status: unknown.status, body: await unknown.text() });

  const direct = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'admin@wilms.demo', password: 'DemoAdmin1!' }),
  });
  results.push({
    test: 'direct-api-login',
    status: direct.status,
    body: (await direct.text()).slice(0, 200),
  });

  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
