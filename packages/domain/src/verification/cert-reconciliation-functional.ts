/**
 * P14.3B Phase 4C.4 — Reconciliation functional, idempotency, integrity, and audit certification.
 *
 * Usage: npm run cert:reconciliation:functional -w @wilms/api
 */
import '../config/load-env.js';
import { and, count, eq } from 'drizzle-orm';
import { getDb, isDatabaseEnabled } from '../db/client.js';
import { auditEntries } from '../db/schema/audit.js';
import { financialAdjustments } from '../db/schema/financial-adjustments.js';
import { financialReversals } from '../db/schema/financial-reversals.js';
import {
  financialReconciliations,
  reconciliationHistory,
} from '../db/schema/financial-reconciliations.js';
import { ledgerEntries } from '../db/schema/ledger-entries.js';
import { loanPools } from '../db/schema/loan-pools.js';
import { loans } from '../db/schema/loans.js';
import { loanSchedules } from '../db/schema/loan-schedules.js';
import { payments } from '../db/schema/payments.js';
import {
  calculateExpectedDuePesewas,
  calculateSystemRecordedPesewas,
} from '../domain/reconciliation/expected-cash.js';
import {
  calculatePrimaryVariancePesewas,
  classifyVariance,
  isVarianceFlagged,
} from '../domain/reconciliation/variance.js';
import { DEFAULT_RECONCILIATION_THRESHOLD_PERCENT } from '../domain/reconciliation/types.js';
import * as loanRepo from '../repositories/loan.repository.js';
import * as paymentRepo from '../repositories/payment.repository.js';
import * as reconciliationHistoryRepo from '../repositories/reconciliation-history.repository.js';
import * as reconciliationRepo from '../repositories/reconciliation.repository.js';
import {
  getReconciliationById,
  getReconciliationHistory,
  getReconciliationSummary,
  listReconciliations,
  submitReconciliation,
} from '../modules/reconciliation/service.js';
import {
  certDateForIndex,
  resolveCertActors,
  waitForAuditEntry,
  ensureCertCollectorPortfolio,
  DEMO_COLLECTOR_EMAIL,
} from './cert-reconciliation-prep.js';
import { DEMO_PASSWORDS, httpJson, loginViaApp, withTestApp } from './cert-reconciliation-http.js';

interface CertCheck {
  name: string;
  passed: boolean;
  detail: string;
}

async function snapshotFinancialCounts() {
  const db = getDb();
  const countFrom = async (source: typeof loans | typeof payments) => {
    const [row] = await db.select({ value: count() }).from(source as typeof loans);
    return Number(row?.value ?? 0);
  };

  return {
    loans: await countFrom(loans),
    payments: await countFrom(payments),
    schedules: await countFrom(loanSchedules as unknown as typeof loans),
    ledger: await countFrom(ledgerEntries as unknown as typeof loans),
    pools: await countFrom(loanPools as unknown as typeof loans),
    adjustments: await countFrom(financialAdjustments as unknown as typeof loans),
    reversals: await countFrom(financialReversals as unknown as typeof loans),
  };
}

async function httpRequest(
  method: 'GET' | 'POST',
  path: string,
  token: string | undefined,
  body?: unknown,
): Promise<{ status: number; json: unknown }> {
  return withTestApp((baseUrl) => httpJson(baseUrl, method, path, token, body));
}

export async function runFunctionalCertification(): Promise<CertCheck[]> {
  const checks: CertCheck[] = [];
  const actors = await resolveCertActors();
  await ensureCertCollectorPortfolio(actors.collectorId);
  const suffix = Date.now();
  const certDate = certDateForIndex(100 + (suffix % 3000));
  const idempotencyKey = `cert-reconciliation-idem-${suffix}`;

  const dueLoans = await loanRepo.listPortfolioLoansForCollector(actors.collectorId);
  const paymentRows = await paymentRepo.listConfirmedPaymentsForCollectorOnDate(
    actors.collectorId,
    certDate,
  );

  const expectedDue = calculateExpectedDuePesewas(
    dueLoans.map((loan) => ({
      paymentDay: loan.paymentDay,
      weeklyPaymentPesewas: loan.weeklyPaymentPesewas,
    })),
    certDate,
  );
  const physicalCashPesewas = expectedDue;
  const systemRecorded = calculateSystemRecordedPesewas(
    paymentRows.map((payment) => ({
      amountPesewas: payment.amountPesewas,
      status: payment.status,
    })),
  );
  const primaryVariance = calculatePrimaryVariancePesewas(physicalCashPesewas, expectedDue);
  const varianceClass = classifyVariance(primaryVariance);
  const varianceFlagged = isVarianceFlagged(
    primaryVariance,
    expectedDue,
    DEFAULT_RECONCILIATION_THRESHOLD_PERCENT,
  );

  const countsBefore = await snapshotFinancialCounts();

  const preview = await getReconciliationSummary(actors.collectorId, certDate);
  checks.push({
    name: 'preview-summary-computed',
    passed: preview.submitted === false && preview.expectedPesewas === expectedDue,
    detail: `expected=${preview.expectedPesewas} actual=${preview.actualPesewas} submitted=${preview.submitted}`,
  });

  const submitted = await submitReconciliation(
    {
      collectorId: actors.collectorId,
      reconciliationDate: certDate,
      physicalCashPesewas,
      actorId: actors.collectorId,
      actorDisplayName: actors.collectorDisplayName,
    },
    idempotencyKey,
  );

  checks.push({
    name: 'submit-persisted',
    passed: submitted.submitted === true,
    detail: `collector=${submitted.collectorId} date=${submitted.date}`,
  });

  const row = await reconciliationRepo.findSubmittedReconciliationByCollectorAndDate(
    actors.collectorId,
    certDate,
  );
  checks.push({
    name: 'snapshot-persisted',
    passed: row != null && row.physicalCashPesewas === physicalCashPesewas,
    detail: row ? `id=${row.id} status=${row.status}` : 'missing row',
  });

  if (row) {
    checks.push({
      name: 'formula-expected-due',
      passed: row.expectedDuePesewas === expectedDue,
      detail: `stored=${row.expectedDuePesewas} computed=${expectedDue}`,
    });
    checks.push({
      name: 'formula-system-recorded',
      passed: row.systemRecordedPesewas === systemRecorded,
      detail: `stored=${row.systemRecordedPesewas} computed=${systemRecorded}`,
    });
    checks.push({
      name: 'formula-primary-variance',
      passed: row.primaryVariancePesewas === primaryVariance,
      detail: `stored=${row.primaryVariancePesewas} computed=${primaryVariance}`,
    });
    checks.push({
      name: 'formula-variance-class',
      passed: row.varianceClass === varianceClass,
      detail: `stored=${row.varianceClass} computed=${varianceClass}`,
    });
    checks.push({
      name: 'formula-variance-flagged',
      passed: row.varianceFlagged === varianceFlagged,
      detail: `stored=${row.varianceFlagged} computed=${varianceFlagged}`,
    });
  }

  const history =
    row != null ? await reconciliationHistoryRepo.listHistoryForReconciliation(row.id) : [];
  checks.push({
    name: 'history-created',
    passed: history.length === 1 && history[0]?.eventType === 'SUBMITTED',
    detail: `events=${history.length}`,
  });

  const auditTarget = `${actors.collectorId}:${certDate}`;
  const auditFound = await waitForAuditEntry(auditTarget, {
    action: 'RECONCILIATION_SUBMITTED',
  });
  checks.push({
    name: 'audit-trail-created',
    passed: auditFound,
    detail: auditFound ? `target=${auditTarget}` : 'audit entry not found within timeout',
  });

  if (row) {
    const byId = await getReconciliationById(row.id);
    checks.push({
      name: 'get-by-id',
      passed: byId?.date === certDate,
      detail: byId ? `id=${row.id}` : 'null',
    });

    const historyViaService = await getReconciliationHistory(row.id);
    checks.push({
      name: 'get-history',
      passed: historyViaService.length === 1,
      detail: `rows=${historyViaService.length}`,
    });
  }

  const listed = await listReconciliations({ collectorId: actors.collectorId });
  checks.push({
    name: 'list-reconciliations',
    passed: listed.some((item) => item.date === certDate),
    detail: `count=${listed.length}`,
  });

  let duplicateBlocked = false;
  try {
    await submitReconciliation({
      collectorId: actors.collectorId,
      reconciliationDate: certDate,
      physicalCashPesewas: 1,
      actorId: actors.collectorId,
    });
  } catch (error) {
    duplicateBlocked =
      error instanceof Error &&
      error.message.includes('VALIDATION:Reconciliation already submitted');
  }
  checks.push({
    name: 'duplicate-submit-blocked',
    passed: duplicateBlocked,
    detail: duplicateBlocked ? 'VALIDATION blocked' : 'not blocked',
  });

  const replay = await submitReconciliation(
    {
      collectorId: actors.collectorId,
      reconciliationDate: certDate,
      physicalCashPesewas,
      actorId: actors.collectorId,
    },
    idempotencyKey,
  );
  checks.push({
    name: 'idempotency-replay',
    passed: replay.date === certDate && replay.submitted === true,
    detail: `date=${replay.date}`,
  });

  const reconciliationCount = await getDb()
    .select({ value: count() })
    .from(financialReconciliations)
    .where(
      and(
        eq(financialReconciliations.collectorUserId, actors.collectorId),
        eq(financialReconciliations.reconciliationDate, certDate),
      ),
    );
  const historyCount = row
    ? (
        await getDb()
          .select({ value: count() })
          .from(reconciliationHistory)
          .where(eq(reconciliationHistory.reconciliationId, row.id))
      )[0]?.value
    : 0;
  const auditCount = (
    await getDb()
      .select({ value: count() })
      .from(auditEntries)
      .where(eq(auditEntries.targetEntityId, auditTarget))
  )[0]?.value;

  checks.push({
    name: 'idempotency-single-persistence',
    passed: Number(reconciliationCount[0]?.value ?? 0) === 1 && Number(historyCount) === 1,
    detail: `reconciliations=${reconciliationCount[0]?.value} history=${historyCount} audit=${auditCount}`,
  });

  const countsAfter = await snapshotFinancialCounts();
  checks.push({
    name: 'financial-integrity-loans',
    passed: countsBefore.loans === countsAfter.loans,
    detail: `before=${countsBefore.loans} after=${countsAfter.loans}`,
  });
  checks.push({
    name: 'financial-integrity-payments',
    passed: countsBefore.payments === countsAfter.payments,
    detail: `before=${countsBefore.payments} after=${countsAfter.payments}`,
  });
  checks.push({
    name: 'financial-integrity-schedules',
    passed: countsBefore.schedules === countsAfter.schedules,
    detail: `before=${countsBefore.schedules} after=${countsAfter.schedules}`,
  });
  checks.push({
    name: 'financial-integrity-ledger',
    passed: countsBefore.ledger === countsAfter.ledger,
    detail: `before=${countsBefore.ledger} after=${countsAfter.ledger}`,
  });
  checks.push({
    name: 'financial-integrity-pools',
    passed: countsBefore.pools === countsAfter.pools,
    detail: `before=${countsBefore.pools} after=${countsAfter.pools}`,
  });
  checks.push({
    name: 'financial-integrity-adjustments',
    passed: countsBefore.adjustments === countsAfter.adjustments,
    detail: `before=${countsBefore.adjustments} after=${countsAfter.adjustments}`,
  });
  checks.push({
    name: 'financial-integrity-reversals',
    passed: countsBefore.reversals === countsAfter.reversals,
    detail: `before=${countsBefore.reversals} after=${countsAfter.reversals}`,
  });

  const collectorToken = await withTestApp((baseUrl) =>
    loginViaApp(baseUrl, DEMO_COLLECTOR_EMAIL, DEMO_PASSWORDS.collector),
  );

  const httpPreview = await httpRequest(
    'GET',
    `/api/v1/reconciliation?collectorId=${encodeURIComponent(actors.collectorId)}&date=${encodeURIComponent(certDate)}`,
    collectorToken,
  );
  checks.push({
    name: 'api-get-reconciliation',
    passed: httpPreview.status === 200,
    detail: `status=${httpPreview.status}`,
  });

  return checks;
}

async function main(): Promise<void> {
  console.log('P14.3B.4C.4 Functional Certification');
  console.log(`Started: ${new Date().toISOString()}`);

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
  console.log(`Finished: ${new Date().toISOString()}`);
  process.exit(passed === checks.length ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
