/**
 * P14.3B Phase 4C.4 — Reconciliation concurrency certification.
 *
 * Usage: npm run cert:reconciliation:concurrency -w @wilms/api
 */
import '../config/load-env.js';
import { and, count, eq } from 'drizzle-orm';
import { getDb, isDatabaseEnabled } from '../db/client.js';
import {
  financialReconciliations,
  reconciliationHistory,
} from '../db/schema/financial-reconciliations.js';
import { calculateExpectedDuePesewas } from '../domain/reconciliation/expected-cash.js';
import * as loanRepo from '../repositories/loan.repository.js';
import { submitReconciliation } from '../modules/reconciliation/service.js';
import { certDateForIndex, resolveCertActors, ensureCertCollectorPortfolio } from './cert-reconciliation-prep.js';

const CONCURRENCY_LEVELS = [10, 25, 50] as const;

export interface ConcurrencyCertResult {
  level: number;
  successes: number;
  persistedRows: number;
  historyRows: number;
  validationRejections: number;
  duplicateRejections: number;
  otherRejections: number;
  passed: boolean;
  detail: string;
}

export async function runConcurrencyLevel(
  level: number,
  actors: Awaited<ReturnType<typeof resolveCertActors>>,
): Promise<ConcurrencyCertResult> {
  const certDate = certDateForIndex(10_000 + level + Date.now() % 500);
  const dueLoans = await loanRepo.listPortfolioLoansForCollector(actors.collectorId);
  const expectedDue = calculateExpectedDuePesewas(
    dueLoans.map((loan) => ({
      paymentDay: loan.paymentDay,
      weeklyPaymentPesewas: loan.weeklyPaymentPesewas,
    })),
    certDate,
  );
  const physicalCashPesewas = expectedDue;

  const attempts = await Promise.allSettled(
    Array.from({ length: level }, (_, index) =>
      submitReconciliation(
        {
          collectorId: actors.collectorId,
          reconciliationDate: certDate,
          physicalCashPesewas,
          actorId: actors.collectorId,
          actorDisplayName: actors.collectorDisplayName,
        },
        `cert-concurrency-${level}-${index}-${Date.now()}`,
      ),
    ),
  );

  let validationRejections = 0;
  let duplicateRejections = 0;
  let otherRejections = 0;

  for (const outcome of attempts) {
    if (outcome.status === 'rejected') {
      const message =
        outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason);
      if (message.includes('VALIDATION:Reconciliation already submitted')) {
        validationRejections += 1;
      } else if (message.startsWith('DUPLICATE:')) {
        duplicateRejections += 1;
      } else {
        otherRejections += 1;
      }
    }
  }

  const successes = attempts.filter((outcome) => outcome.status === 'fulfilled').length;
  const db = getDb();
  const [persisted] = await db
    .select({ value: count() })
    .from(financialReconciliations)
    .where(
      and(
        eq(financialReconciliations.collectorUserId, actors.collectorId),
        eq(financialReconciliations.reconciliationDate, certDate),
      ),
    );

  const reconciliationRow = await db
    .select({ id: financialReconciliations.id })
    .from(financialReconciliations)
    .where(
      and(
        eq(financialReconciliations.collectorUserId, actors.collectorId),
        eq(financialReconciliations.reconciliationDate, certDate),
      ),
    )
    .limit(1);

  const historyRows = reconciliationRow[0]
    ? (
        await db
          .select({ value: count() })
          .from(reconciliationHistory)
          .where(eq(reconciliationHistory.reconciliationId, reconciliationRow[0].id))
      )[0]?.value
    : 0;

  const persistedRows = Number(persisted?.value ?? 0);
  const passed = successes === 1 && persistedRows === 1 && Number(historyRows) === 1 && otherRejections === 0;

  return {
    level,
    successes,
    persistedRows,
    historyRows: Number(historyRows),
    validationRejections,
    duplicateRejections,
    otherRejections,
    passed,
    detail: `successes=${successes} persisted=${persistedRows} history=${historyRows} validation=${validationRejections} duplicate=${duplicateRejections}`,
  };
}

async function main(): Promise<void> {
  console.log('P14.3B.4C.4 Concurrency Certification');
  console.log(`Started: ${new Date().toISOString()}`);

  if (!isDatabaseEnabled()) {
    process.exit(1);
  }

  const actors = await resolveCertActors();
  await ensureCertCollectorPortfolio(actors.collectorId);
  let allPassed = true;

  console.log('\n| Level | Successes | Persisted | History | Validation Rej | Duplicate Rej | Other | Pass |');
  console.log('|-------|-----------|-----------|---------|----------------|---------------|-------|------|');

  for (const level of CONCURRENCY_LEVELS) {
    const result = await runConcurrencyLevel(level, actors);
    console.log(
      `| ${result.level} | ${result.successes} | ${result.persistedRows} | ${result.historyRows} | ${result.validationRejections} | ${result.duplicateRejections} | ${result.otherRejections} | ${result.passed ? 'YES' : 'NO'} |`,
    );
    if (!result.passed) {
      allPassed = false;
    }
  }

  console.log(`Finished: ${new Date().toISOString()}`);
  process.exit(allPassed ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
