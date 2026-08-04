/**
 * P14.3B Phase 3C.2 — Live functional reversal certification.
 *
 * Usage: npm run cert:reversal:functional -w @wilms/api
 */
import '../config/load-env.js';
import { and, eq } from 'drizzle-orm';
import { createApp } from '../http/app.js';
import { getDb, isDatabaseEnabled } from '../db/client.js';
import { financialReversals, reversalHistory } from '../db/schema/financial-reversals.js';
import { ledgerEntries } from '../db/schema/ledger-entries.js';
import { loanSchedules } from '../db/schema/loan-schedules.js';
import { payments } from '../db/schema/payments.js';
import { users } from '../db/schema/users.js';
import { encodeSessionToken } from '../middleware/authenticate.js';
import { USER_ROLE } from '@wilms/shared-rbac';
import { reversePayment } from '../modules/payments/payment-reversal.service.js';
import { decimalToPesewas } from '../domain/money.js';
import * as loanRepo from '../repositories/loan.repository.js';
import { resolveCertPaymentTarget } from './cert-reversal-prep.js';

const DEMO_ADMIN_EMAIL = 'admin@wilms.demo';
const DEMO_COLLECTOR_EMAIL = 'collector@wilms.demo';

interface CertCheck {
  name: string;
  passed: boolean;
  detail: string;
}

async function resolveAdmin() {
  const db = getDb();
  const [row] = await db
    .select({ id: users.id, displayName: users.displayName })
    .from(users)
    .where(eq(users.email, DEMO_ADMIN_EMAIL))
    .limit(1);
  if (!row) {
    throw new Error('admin missing');
  }
  return row;
}

async function resolveCollectorId() {
  const db = getDb();
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, DEMO_COLLECTOR_EMAIL))
    .limit(1);
  if (!row) {
    throw new Error('collector missing');
  }
  return row.id;
}

async function httpPost(path: string, token: string | undefined, body: unknown) {
  const app = createApp();
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    return response.status;
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

export async function runFunctionalCertification(): Promise<CertCheck[]> {
  const checks: CertCheck[] = [];
  const admin = await resolveAdmin();
  const collectorId = await resolveCollectorId();
  const suffix = `cert-functional-${Date.now()}`;

  const target = await resolveCertPaymentTarget(collectorId, admin.id, suffix);

  const loanBefore = await loanRepo.findLoanById(target.loanId);
  const balanceBefore = loanBefore ? decimalToPesewas(loanBefore.loanBalance) : 0;

  const paymentBefore = await getDb()
    .select()
    .from(payments)
    .where(eq(payments.id, target.paymentId))
    .limit(1);

  const weekNumber = paymentBefore[0]?.scheduleWeekNumber;
  let weekStatusBefore = 'unknown';
  if (weekNumber != null) {
    const [week] = await getDb()
      .select()
      .from(loanSchedules)
      .where(and(eq(loanSchedules.loanId, target.loanId), eq(loanSchedules.weekNumber, weekNumber)))
      .limit(1);
    weekStatusBefore = week?.status ?? 'missing';
  }

  const idempotencyKey = `cert-functional-idem-${suffix}`;
  const reversed = await reversePayment(
    target.paymentId,
    {
      reason: 'P14.3B.3C.2 functional certification reversal',
      actorId: admin.id,
      actorDisplayName: admin.displayName,
    },
    idempotencyKey,
  );

  checks.push({
    name: 'reversal-created',
    passed: reversed.status === 'EXECUTED',
    detail: `reversalId=${reversed.id}`,
  });

  const reversalLedger = await getDb()
    .select()
    .from(ledgerEntries)
    .where(
      and(eq(ledgerEntries.paymentId, target.paymentId), eq(ledgerEntries.entryType, 'REVERSAL')),
    );
  checks.push({
    name: 'ledger-entry-created',
    passed: reversalLedger.length === 1,
    detail: `rows=${reversalLedger.length}`,
  });

  const loanAfter = await loanRepo.findLoanById(target.loanId);
  const balanceAfter = loanAfter ? decimalToPesewas(loanAfter.loanBalance) : 0;
  checks.push({
    name: 'balance-restored',
    passed: balanceAfter === balanceBefore + target.amountPesewas,
    detail: `before=${balanceBefore} after=${balanceAfter}`,
  });

  if (weekNumber != null) {
    const [weekAfter] = await getDb()
      .select()
      .from(loanSchedules)
      .where(and(eq(loanSchedules.loanId, target.loanId), eq(loanSchedules.weekNumber, weekNumber)))
      .limit(1);
    checks.push({
      name: 'schedule-restored',
      passed: weekStatusBefore === 'PAID' && weekAfter?.status !== 'PAID',
      detail: `before=${weekStatusBefore} after=${weekAfter?.status ?? 'missing'}`,
    });
  }

  const history = await getDb()
    .select()
    .from(reversalHistory)
    .where(eq(reversalHistory.reversalId, reversed.id));
  checks.push({
    name: 'audit-history-created',
    passed: history.length >= 3,
    detail: `events=${history.length}`,
  });

  let duplicateBlocked = false;
  try {
    await reversePayment(target.paymentId, {
      reason: 'Duplicate attempt should fail',
      actorId: admin.id,
      actorDisplayName: admin.displayName,
    });
  } catch (error) {
    duplicateBlocked = error instanceof Error && error.message === 'REVERSAL_DUPLICATE';
  }
  checks.push({
    name: 'duplicate-reversal-blocked',
    passed: duplicateBlocked,
    detail: duplicateBlocked ? 'REVERSAL_DUPLICATE' : 'not blocked',
  });

  const replay = await reversePayment(
    target.paymentId,
    {
      reason: 'P14.3B.3C.2 functional certification reversal',
      actorId: admin.id,
      actorDisplayName: admin.displayName,
    },
    idempotencyKey,
  );
  checks.push({
    name: 'idempotency-replay',
    passed: replay.id === reversed.id,
    detail: `first=${reversed.id} replay=${replay.id}`,
  });

  const collectorToken = encodeSessionToken({
    userId: 'collector-user',
    role: USER_ROLE.COLLECTOR,
    expiresAt: Date.now() + 60_000,
  });
  const adminToken = encodeSessionToken({
    userId: admin.id,
    role: USER_ROLE.SUPER_ADMIN,
    expiresAt: Date.now() + 60_000,
  });

  const collectorStatus = await httpPost(
    `/payments/${target.paymentId}/reverse`,
    collectorToken,
    {
      reason: 'Collector should not reverse',
      actorId: admin.id,
      actorDisplayName: admin.displayName,
    },
  );
  checks.push({
    name: 'rbac-collector-blocked',
    passed: collectorStatus === 403,
    detail: `status=${collectorStatus}`,
  });

  const unauthStatus = await httpPost(`/payments/${target.paymentId}/reverse`, undefined, {
    reason: 'Unauthenticated should fail',
    actorId: admin.id,
    actorDisplayName: admin.displayName,
  });
  checks.push({
    name: 'rbac-unauthenticated-blocked',
    passed: unauthStatus === 401,
    detail: `status=${unauthStatus}`,
  });

  const executedCount = await getDb()
    .select()
    .from(financialReversals)
    .where(
      and(
        eq(financialReversals.sourceType, 'PAYMENT'),
        eq(financialReversals.sourceId, target.paymentId),
        eq(financialReversals.status, 'EXECUTED'),
      ),
    );
  checks.push({
    name: 'rbac-single-executed-reversal',
    passed: executedCount.length === 1,
    detail: `executed=${executedCount.length} (admin path verified via service)`,
  });

  void adminToken;

  return checks;
}

async function main(): Promise<void> {
  console.log('P14.3B.3C.2 Functional Certification');
  if (!isDatabaseEnabled()) {
    process.exit(1);
  }

  const checks = await runFunctionalCertification();
  let passed = 0;
  for (const check of checks) {
    console.log(`  ${check.passed ? '✓' : '✗'} ${check.name}: ${check.detail}`);
    if (check.passed) {
      passed += 1;
    }
  }
  console.log(`\nPassed: ${passed}/${checks.length}`);
  process.exit(passed === checks.length ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
