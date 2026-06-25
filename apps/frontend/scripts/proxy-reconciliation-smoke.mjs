/**
 * P14.3B.4D.1 — Proxy path smoke test (Next.js /api/auth + /api/wilms).
 *
 * Prerequisites:
 *   - Backend running: npm run start -w @wilms/api
 *   - Frontend running: npm run dev (with NEXT_PUBLIC_USE_MOCK=false in .env.local)
 *
 * Usage: node apps/frontend/scripts/proxy-reconciliation-smoke.mjs
 */
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://127.0.0.1:3000';
const CERT_DATE = `2031-${String(Math.floor(Math.random() * 11) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 27) + 1).padStart(2, '0')}`;

function parseCookies(setCookieHeader) {
  if (!setCookieHeader) return '';
  const parts = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  return parts.map((part) => part.split(';')[0]).join('; ');
}

async function main() {
  const steps = [];
  let collectorId;
  let sessionCookie = '';

  const loginRes = await fetch(`${FRONTEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email: 'collector@wilms.demo', password: 'DemoCollect1!' }),
  });
  sessionCookie = parseCookies(loginRes.headers.getSetCookie?.() ?? loginRes.headers.get('set-cookie'));
  const loginJson = await loginRes.json();
  collectorId = loginJson.user?.id;
  steps.push({
    step: 'login',
    status: loginRes.status,
    passed: loginRes.status === 200 && Boolean(sessionCookie),
    detail: { userId: collectorId, hasCookie: Boolean(sessionCookie) },
  });

  const getRes = await fetch(
    `${FRONTEND_URL}/api/wilms/reconciliation?collectorId=${encodeURIComponent(collectorId)}&date=${CERT_DATE}`,
    { headers: { Accept: 'application/json', Cookie: sessionCookie } },
  );
  const getJson = await getRes.json();
  steps.push({
    step: 'fetch-reconciliation',
    status: getRes.status,
    passed: getRes.status === 200,
    detail: getJson,
  });

  const submitRes = await fetch(`${FRONTEND_URL}/api/wilms/reconciliations`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Cookie: sessionCookie,
    },
    body: JSON.stringify({
      collectorId,
      date: CERT_DATE,
      physicalCashPesewas: getJson.data?.expectedPesewas ?? 0,
    }),
  });
  const submitJson = await submitRes.json();
  steps.push({
    step: 'submit-reconciliation',
    status: submitRes.status,
    passed: submitRes.status === 201,
    detail: submitJson,
  });

  const dupRes = await fetch(`${FRONTEND_URL}/api/wilms/reconciliations`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Cookie: sessionCookie,
    },
    body: JSON.stringify({ collectorId, date: CERT_DATE, physicalCashPesewas: 0 }),
  });
  const dupJson = await dupRes.json();
  steps.push({
    step: 'duplicate-submit',
    status: dupRes.status,
    passed: dupRes.status === 422 || dupRes.status === 409,
    detail: dupJson,
  });

  const officerLogin = await fetch(`${FRONTEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'officer@wilms.demo', password: 'DemoOfficer1!' }),
  });
  const officerCookie = parseCookies(
    officerLogin.headers.getSetCookie?.() ?? officerLogin.headers.get('set-cookie'),
  );
  const rbacDate = `${CERT_DATE.slice(0, 8)}${String(Number(CERT_DATE.slice(8)) + 1).padStart(2, '0')}`;
  const rbacRes = await fetch(`${FRONTEND_URL}/api/wilms/reconciliations`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Cookie: officerCookie,
    },
    body: JSON.stringify({ collectorId, date: rbacDate, physicalCashPesewas: 0 }),
  });
  const rbacJson = await rbacRes.json();
  steps.push({
    step: 'rbac-officer-denied',
    status: rbacRes.status,
    passed: rbacRes.status === 403,
    detail: rbacJson,
  });

  const passed = steps.filter((s) => s.passed).length;
  const report = {
    startedAt: new Date().toISOString(),
    frontendUrl: FRONTEND_URL,
    certDate: CERT_DATE,
    steps,
    summary: `${passed}/${steps.length} passed`,
  };

  console.log(JSON.stringify(report, null, 2));
  process.exit(passed === steps.length ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
