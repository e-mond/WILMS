/**
 * P14.3B Phase 2 — Financial adjustment verification runner.
 *
 * Usage: npm run verify:adjustments -w @wilms/api
 */
import '../config/load-env.js';
import { isDatabaseEnabled } from '../db/client.js';
import {
  adjustmentChecksAvailable,
  runAdjustmentIntegrityChecks,
  runAdjustmentWorkflowChecks,
} from './adjustment-checks.js';
import { summarizeResults, type VerificationResult } from './unit-checks.js';

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
  console.log('P14.3B Financial Adjustments Verification');
  console.log(`DATABASE_URL: ${isDatabaseEnabled() ? 'configured' : 'NOT configured'}`);

  if (!adjustmentChecksAvailable()) {
    console.error('Adjustment verification requires DATABASE_URL.');
    process.exit(1);
  }

  const workflow = await runAdjustmentWorkflowChecks();
  printSection('Adjustment Workflow', workflow);

  const integrity = await runAdjustmentIntegrityChecks();
  printSection('Adjustment Integrity', integrity);

  const all = [...workflow, ...integrity];
  const summary = summarizeResults(all);
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total: ${summary.passed}/${all.length} passed`);

  process.exit(summary.failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
