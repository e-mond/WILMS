/**
 * P14.3B Phase 1 — Loan pool verification runner.
 *
 * Usage: npm run verify:pools -w @wilms/api
 */
import '../config/load-env.js';
import { isDatabaseEnabled } from '../db/client.js';
import { poolChecksAvailable, runPoolApiChecks, runPoolIntegrityChecks } from './pool-checks.js';
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
  console.log('P14.3B Loan Pool Verification');
  console.log(`DATABASE_URL: ${isDatabaseEnabled() ? 'configured' : 'NOT configured'}`);

  if (!poolChecksAvailable()) {
    console.error('Pool verification requires DATABASE_URL.');
    process.exit(1);
  }

  const integrity = await runPoolIntegrityChecks();
  printSection('Pool Balance Integrity', integrity);

  const api = await runPoolApiChecks();
  printSection('Pool API Checks', api);

  const all = [...integrity, ...api];
  const summary = summarizeResults(all);
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total: ${summary.passed}/${all.length} passed`);

  process.exit(summary.failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
