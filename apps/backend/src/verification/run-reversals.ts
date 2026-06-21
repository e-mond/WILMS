/**
 * P14.3B Phase 3C.1 — Payment reversal verification runner.
 *
 * Usage: npm run verify:reversals -w @wilms/api
 */
import '../config/load-env.js';
import { isDatabaseEnabled } from '../db/client.js';
import {
  reversalChecksAvailable,
  runPaymentReversalIntegrityChecks,
  runPaymentReversalSafetyChecks,
  runPaymentReversalWorkflowChecks,
} from './reversal-checks.js';
import { runReversalBalanceChecks, summarizeResults, type VerificationResult } from './unit-checks.js';

function printSection(title: string, results: VerificationResult[]): void {
  const summary = summarizeResults(results);
  console.log(`\n## ${title}`);
  console.log(`Passed: ${summary.passed}/${results.length}`);
  for (const result of results) {
    const icon = result.passed ? '✓' : '✗';
    console.log(`  ${icon} ${result.name}: ${result.detail}`);
  }
}

async function main(): Promise<void> {
  console.log('P14.3B Payment Reversal Verification (Phase 3C.1 MVP)');
  console.log(`DATABASE_URL: ${isDatabaseEnabled() ? 'configured' : 'NOT configured'}`);

  const unitResults = runReversalBalanceChecks();
  printSection('Unit Checks (no DB)', unitResults);

  if (!reversalChecksAvailable()) {
    console.error('\nReversal verification requires DATABASE_URL.');
    process.exit(1);
  }

  const workflow = await runPaymentReversalWorkflowChecks();
  printSection('Payment Reversal Workflow', workflow);

  const safety = await runPaymentReversalSafetyChecks();
  printSection('Payment Reversal Safety', safety);

  const integrity = await runPaymentReversalIntegrityChecks();
  printSection('Payment Reversal Integrity', integrity);

  const all = [...unitResults, ...workflow, ...safety, ...integrity];
  const summary = summarizeResults(all);
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total: ${summary.passed}/${all.length} passed`);

  process.exit(summary.failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
