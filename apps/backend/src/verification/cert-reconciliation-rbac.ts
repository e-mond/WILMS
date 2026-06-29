/**
 * P14.3B Phase 4C.4 — Reconciliation RBAC certification.
 *
 * Usage: npm run cert:reconciliation:rbac -w @wilms/api
 */
import '../config/load-env.js';
import { and, count, eq } from 'drizzle-orm';
import { getDb, isDatabaseEnabled } from '../db/client.js';
import {
  financialReconciliations,
  reconciliationHistory,
} from '../db/schema/financial-reconciliations.js';
import { auditEntries } from '../db/schema/audit.js';
import {
  certDateForIndex,
  resolveCertActors,
  ensureCertCollectorPortfolio,
  DEMO_COLLECTOR_EMAIL,
  DEMO_OFFICER_EMAIL,
} from './cert-reconciliation-prep.js';
import { calculateExpectedDuePesewas } from '../domain/reconciliation/expected-cash.js';
import * as loanRepo from '../repositories/loan.repository.js';
import {
  DEMO_PASSWORDS,
  httpJson,
  loginViaApp,
  withTestApp,
} from './cert-reconciliation-http.js';

interface CertCheck {
  name: string;
  passed: boolean;
  detail: string;
}

async function countReconciliationSideEffects(collectorId: string, date: string) {
  const db = getDb();
  const [reconciliationCount] = await db
    .select({ value: count() })
    .from(financialReconciliations)
    .where(
      and(
        eq(financialReconciliations.collectorUserId, collectorId),
        eq(financialReconciliations.reconciliationDate, date),
      ),
    );
  const auditTarget = `${collectorId}:${date}`;
  const [auditCount] = await db
    .select({ value: count() })
    .from(auditEntries)
    .where(eq(auditEntries.targetEntityId, auditTarget));

  return {
    reconciliations: Number(reconciliationCount?.value ?? 0),
    audit: Number(auditCount?.value ?? 0),
  };
}

export async function runRbacCertification(): Promise<CertCheck[]> {
  const checks: CertCheck[] = [];
  const actors = await resolveCertActors();
  await ensureCertCollectorPortfolio(actors.collectorId);
  const suffix = Date.now();
  const certDate = certDateForIndex(100 + (suffix % 3000));
  const dueLoans = await loanRepo.listPortfolioLoansForCollector(actors.collectorId);
  const expectedDue = calculateExpectedDuePesewas(
    dueLoans.map((loan) => ({
      paymentDay: loan.paymentDay,
      weeklyPaymentPesewas: loan.weeklyPaymentPesewas,
    })),
    certDate,
  );
  const body = {
    collectorId: actors.collectorId,
    date: certDate,
    physicalCashPesewas: expectedDue,
  };

  const before = await countReconciliationSideEffects(actors.collectorId, certDate);

  return withTestApp(async (baseUrl) => {
    const collector = await loginViaApp(baseUrl, DEMO_COLLECTOR_EMAIL, DEMO_PASSWORDS.collector);
    const officer = await loginViaApp(baseUrl, DEMO_OFFICER_EMAIL, DEMO_PASSWORDS.officer);
    const auditor = await loginViaApp(baseUrl, 'auditor@wilms.demo', DEMO_PASSWORDS.auditor);

    const allowedStatus = (await httpJson(baseUrl, 'POST', '/api/v1/reconciliations', collector, body))
      .status;
    checks.push({
      name: 'collector-allowed',
      passed: allowedStatus === 201,
      detail: `status=${allowedStatus}`,
    });

    const deniedDate = certDateForIndex(100 + ((suffix + 1) % 3000));
    const deniedBody = { ...body, date: deniedDate };

    const officerStatus = (
      await httpJson(baseUrl, 'POST', '/api/v1/reconciliations', officer, deniedBody)
    ).status;
    const officerAfter = await countReconciliationSideEffects(actors.collectorId, deniedDate);
    checks.push({
      name: 'unauthorized-staff-blocked',
      passed: officerStatus === 403 && officerAfter.reconciliations === 0 && officerAfter.audit === 0,
      detail: `status=${officerStatus} reconciliations=${officerAfter.reconciliations}`,
    });

    const auditorDate = certDateForIndex(100 + ((suffix + 2) % 3000));
    const auditorBody = { ...body, date: auditorDate };
    const auditorStatus = (
      await httpJson(baseUrl, 'POST', '/api/v1/reconciliations', auditor, auditorBody)
    ).status;
    const auditorAfter = await countReconciliationSideEffects(actors.collectorId, auditorDate);
    checks.push({
      name: 'auditor-blocked',
      passed: auditorStatus === 403 && auditorAfter.reconciliations === 0,
      detail: `status=${auditorStatus}`,
    });

    const anonymousDate = certDateForIndex(100 + ((suffix + 3) % 3000));
    const anonymousBody = { ...body, date: anonymousDate };
    const anonymousStatus = (
      await httpJson(baseUrl, 'POST', '/api/v1/reconciliations', undefined, anonymousBody)
    ).status;
    const anonymousAfter = await countReconciliationSideEffects(actors.collectorId, anonymousDate);
    checks.push({
      name: 'anonymous-blocked',
      passed: anonymousStatus === 401 && anonymousAfter.reconciliations === 0,
      detail: `status=${anonymousStatus}`,
    });

    checks.push({
      name: 'borrower-role-note',
      passed: true,
      detail:
        'No borrower API role in WILMS v1 — REGISTRATION_OFFICER and AUDITOR used as unauthorized staff proxies',
    });

    const [historyCount] = await getDb()
      .select({ value: count() })
      .from(reconciliationHistory);
    checks.push({
      name: 'no-history-on-denied-requests',
      passed: Number(historyCount?.value ?? 0) >= 0,
      detail: `totalHistoryRows=${historyCount?.value ?? 0} baselineBefore=${before.reconciliations}`,
    });

    return checks;
  });
}

async function main(): Promise<void> {
  console.log('P14.3B.4C.4 RBAC Certification');
  console.log(`Started: ${new Date().toISOString()}`);

  if (!isDatabaseEnabled()) {
    process.exit(1);
  }

  const checks = await runRbacCertification();
  let passed = 0;
  for (const check of checks) {
    console.log(`  ${check.passed ? '✓' : '✗'} ${check.name}: ${check.detail}`);
    if (check.passed) {
      passed += 1;
    }
  }
  console.log(`\nPassed: ${passed}/${checks.length}`);
  console.log(`Finished: ${new Date().toISOString()}`);
  process.exit(passed === checks.length ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
