/**
 * P14.3A.1 — Run all financial verification checks.
 *
 * Usage: npm run verify:financial -w @wilms/api
 */
import '../config/load-env.js';
import { eq } from 'drizzle-orm';
import { isDatabaseEnabled, getDb } from '../db/client.js';
import { users } from '../db/schema/users.js';
import {
  runAllocationChecks,
  runCalculationChecks,
  runLifecycleChecks,
  summarizeResults,
  type VerificationResult,
} from './unit-checks.js';
import {
  databaseChecksAvailable,
  runConcurrentRepaymentCheck,
  runDatabaseIntegrityChecks,
  runIdempotencyChecks,
  runLedgerConsistencyChecks,
  runPerformanceChecks,
  runPortfolioReconciliationChecks,
} from './db-checks.js';
import { runSecurityChecks } from './security-checks.js';

function printSection(title: string, results: VerificationResult[]): void {
  const summary = summarizeResults(results);
  console.log(`\n## ${title}`);
  console.log(`Passed: ${summary.passed}/${results.length}`);
  for (const result of results) {
    const icon = result.passed ? '✓' : '✗';
    console.log(`  ${icon} ${result.name}: ${result.detail}`);
  }
}

async function resolveApproverId(): Promise<string | undefined> {
  if (!isDatabaseEnabled()) {
    return undefined;
  }
  const db = getDb();
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, 'approver@wilms.demo'))
    .limit(1);
  return row?.id;
}

async function main(): Promise<void> {
  console.log('P14.3A.1 Financial Verification Harness');
  console.log(`DATABASE_URL: ${databaseChecksAvailable() ? 'configured' : 'not configured (DB checks skipped)'}`);

  const unitResults = [
    ...runCalculationChecks(),
    ...runAllocationChecks(),
    ...runLifecycleChecks(),
  ];
  printSection('Unit Checks (no DB)', unitResults);

  const securityResults = await runSecurityChecks();
  printSection('Security / RBAC Checks', securityResults);

  let dbResults: VerificationResult[] = [];

  if (databaseChecksAvailable()) {
    dbResults.push(...(await runLedgerConsistencyChecks()));
    dbResults.push(...(await runPortfolioReconciliationChecks()));
    dbResults.push(...(await runDatabaseIntegrityChecks()));

    for (const concurrency of [10, 25, 50]) {
      dbResults.push(await runConcurrentRepaymentCheck(concurrency));
    }

    const approverId = await resolveApproverId();
    if (approverId) {
      dbResults.push(...(await runIdempotencyChecks(approverId)));
    }

    dbResults.push(...(await runPerformanceChecks()));
    printSection('Database Checks', dbResults);
  } else {
    console.log('\n## Database Checks');
    console.log('Skipped — set DATABASE_URL and run db:migrate + db:seed to execute.');
  }

  const allResults = [...unitResults, ...securityResults, ...dbResults];
  const summary = summarizeResults(allResults);

  console.log('\n=== SUMMARY ===');
  console.log(`Total: ${summary.passed}/${allResults.length} passed`);

  if (summary.failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
