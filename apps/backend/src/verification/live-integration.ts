/**
 * P14.3A.4 — Live HTTP integration verification (requires running API + DATABASE_URL).
 *
 * Usage: npm run verify:live -w @wilms/api
 */
import '../config/load-env.js';
import { eq } from 'drizzle-orm';
import { isDatabaseEnabled, getDb } from '../db/client.js';
import { ledgerEntries } from '../db/schema/ledger-entries.js';
import { loanSchedules } from '../db/schema/loan-schedules.js';
import { loans } from '../db/schema/loans.js';
import { payments } from '../db/schema/payments.js';
import { users } from '../db/schema/users.js';
import { decimalToPesewas } from '../domain/money.js';
import { CERT_LIVE_BORROWER_ID, ensureCertLiveBorrower } from './cert-live-prep.js';

const BASE = process.env.WILMS_LIVE_API_BASE ?? `http://${process.env.WILMS_API_HOST ?? '127.0.0.1'}:${process.env.WILMS_API_PORT ?? '4000'}`;

interface StepResult {
  name: string;
  passed: boolean;
  detail: string;
  status?: number;
}

const results: StepResult[] = [];

function record(name: string, passed: boolean, detail: string, status?: number): void {
  results.push({ name, passed, detail, status });
}

async function login(email: string, password: string): Promise<string | null> {
  const response = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    return null;
  }
  const json = (await response.json()) as { data?: { token?: string } };
  return json.data?.token ?? null;
}

async function api(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<{ status: number; body: unknown }> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  return { status: response.status, body };
}

async function main(): Promise<void> {
  console.log('P14.3A.4 Live Integration Verification');
  console.log(`API base: ${BASE}`);
  console.log(`DATABASE_URL: ${isDatabaseEnabled() ? 'configured' : 'NOT configured'}`);

  if (!isDatabaseEnabled()) {
    record('database-configured', false, 'DATABASE_URL missing — live verification blocked');
    printSummary();
    process.exit(1);
  }

  await ensureCertLiveBorrower();

  const health = await fetch(`${BASE}/health`);
  record('health-endpoint', health.ok, `status ${health.status}`);

  const adminToken = await login('admin@wilms.demo', 'DemoAdmin1!');
  const approverToken = await login('approver@wilms.demo', 'DemoApprove1!');
  const collectorToken = await login('collector@wilms.demo', 'DemoCollect1!');
  const officerToken = await login('officer@wilms.demo', 'DemoOfficer1!');

  record('login-admin', Boolean(adminToken), adminToken ? 'token received' : 'failed');
  record('login-approver', Boolean(approverToken), approverToken ? 'token received' : 'failed');
  record('login-collector', Boolean(collectorToken), collectorToken ? 'token received' : 'failed');
  record('login-officer', Boolean(officerToken), officerToken ? 'token received' : 'failed');

  if (!approverToken || !collectorToken || !adminToken) {
    printSummary();
    process.exit(1);
  }

  const noAuth = await fetch(`${BASE}/loans`);
  record('rbac-unauthenticated-loans', noAuth.status === 401, `status ${noAuth.status}`);

  const collectorLoans = await api('/loans', collectorToken);
  record('rbac-collector-list-loans-denied', collectorLoans.status === 403, `status ${collectorLoans.status}`);

  const approverLoans = await api('/loans?status=ACTIVE', approverToken);
  record(
    'rbac-approver-list-loans-denied',
    approverLoans.status === 403,
    `status ${approverLoans.status} (requires view-financial-reports)`,
  );

  const adminLoans = await api('/loans?status=ACTIVE', adminToken);
  record(
    'loans-list-active',
    adminLoans.status === 200,
    `status ${adminLoans.status}, count=${Array.isArray((adminLoans.body as { data?: unknown[] }).data) ? (adminLoans.body as { data: unknown[] }).data.length : '?'}`,
  );

  const borrowers = await api('/borrowers', adminToken);
  record('borrowers-list', borrowers.status === 200, `status ${borrowers.status}`);

  const reports = await api('/reports', adminToken);
  record('reports-list', reports.status === 200, `status ${reports.status}`);

  const db = getDb();
  const loanCount = (await db.select().from(loans)).length;
  record('neon-loans-persisted', loanCount >= 4, `loan rows=${loanCount}`);

  const ledgerCount = (await db.select().from(ledgerEntries)).length;
  record('neon-ledger-persisted', ledgerCount > 0, `ledger rows=${ledgerCount}`);

  const activeLoanId = '01930002-0001-7000-8000-000000000001';
  const schedule = await api(`/loans/${activeLoanId}/schedule`, adminToken);
  record('loan-schedule-retrieval', schedule.status === 200, `status ${schedule.status}`);

  const progress = await api(`/loans/${activeLoanId}/progress`, adminToken);
  record('loan-progress-retrieval', progress.status === 200, `status ${progress.status}`);

  const [approverUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, 'approver@wilms.demo'))
    .limit(1);

  const eligible = await api('/borrowers/loan-eligible', approverToken);
  const eligibleList = (eligible.body as { data?: { id: string }[] })?.data ?? [];
  const targetBorrowerId = eligibleList[0]?.id ?? CERT_LIVE_BORROWER_ID;

  const createBody = {
    borrowerId: targetBorrowerId,
    amountPesewas: 20000,
    durationWeeks: 4,
    paymentDay: 'Friday',
    cycleBatch: 'P14.3A.4 Live Test',
    startDate: '2026-06-13',
  };

  const created = await api('/loans', approverToken, {
    method: 'POST',
    body: JSON.stringify(createBody),
  });

  const createdLoan = (created.body as { data?: { id?: string; status?: string } })?.data;
  const workflowLoanId = createdLoan?.id;

  record(
    'workflow-create-loan',
    created.status === 201 && Boolean(workflowLoanId),
    `status ${created.status} id=${workflowLoanId ?? 'none'}`,
  );

  if (workflowLoanId) {
    const approved = await api(`/loans/${workflowLoanId}/approve`, approverToken, { method: 'PATCH' });
    record('workflow-approve-loan', approved.status === 200, `status ${approved.status}`);

    const disbursed = await api(`/loans/${workflowLoanId}/disburse`, approverToken, {
      method: 'POST',
      headers: { 'Idempotency-Key': `p143a4-disburse-${workflowLoanId}` },
    });
    record('workflow-disburse-loan', disbursed.status === 200, `status ${disbursed.status}`);

    const [loanRow] = await db.select().from(loans).where(eq(loans.id, workflowLoanId)).limit(1);
    record(
      'workflow-loan-active-in-db',
      loanRow?.externalStatus === 'ACTIVE',
      `externalStatus=${loanRow?.externalStatus ?? 'missing'}`,
    );

    const [collectorUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, 'collector@wilms.demo'))
      .limit(1);

    if (collectorUser && loanRow) {
      const scheduleRows = await db
        .select()
        .from(loanSchedules)
        .where(eq(loanSchedules.loanId, workflowLoanId));
      const nextPayable = scheduleRows.find((row) => row.status !== 'PAID');
      const paymentDate = nextPayable?.dueDate ?? loanRow.startDate;
      const amountPesewas = nextPayable
        ? decimalToPesewas(nextPayable.installmentAmount)
        : decimalToPesewas(loanRow.installmentAmount);

      const paymentBody = {
        borrowerId: loanRow.borrowerId,
        amountPesewas,
        paymentDate,
        collectorId: collectorUser.id,
      };
      const payment = await api('/payments', collectorToken, {
        method: 'POST',
        body: JSON.stringify(paymentBody),
        headers: { 'Idempotency-Key': `p143a4-payment-${workflowLoanId}` },
      });
      record('workflow-post-repayment', payment.status === 201, `status ${payment.status}`);

      const loanPayments = await db.select().from(payments).where(eq(payments.loanId, workflowLoanId));
      const loanLedger = await db.select().from(ledgerEntries).where(eq(ledgerEntries.loanId, workflowLoanId));
      record('workflow-payment-persisted', loanPayments.length >= 1, `payments=${loanPayments.length}`);
      record('workflow-ledger-updated', loanLedger.length >= 2, `ledger=${loanLedger.length}`);
    }
  }

  record('approver-user-in-db', Boolean(approverUser?.id), approverUser?.id ?? 'missing');

  printSummary();
  const failed = results.filter((r) => !r.passed).length;
  process.exit(failed > 0 ? 1 : 0);
}

function printSummary(): void {
  console.log('\n=== LIVE INTEGRATION RESULTS ===');
  for (const result of results) {
    const icon = result.passed ? '✓' : '✗';
    console.log(`  ${icon} ${result.name}: ${result.detail}`);
  }
  const passed = results.filter((r) => r.passed).length;
  console.log(`\nTotal: ${passed}/${results.length} passed`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
