/**
 * RC1.3.3 — Verify list handlers succeed against an empty database (no business rows).
 *
 * Requires DATABASE_URL pointing at a migrated, empty (users-only) database.
 *
 *   npm run verify:empty-db -w @wilms/api
 */
import '../config/load-env.js';
import { isDatabaseEnabled } from '../db/client.js';
import { verifyCoreApplicationTables } from '../db/schema-health.js';
import { getDashboardSummary } from '../modules/dashboard/service.js';
import { listBorrowerSummaries } from '../modules/borrowers/service.js';
import { listLoans, listPortfolioEntries } from '../modules/loans/service.js';
import { listLoanPools } from '../modules/loan-pools/service.js';
import { listGroupsResponse } from '../modules/groups/service.js';
import { listCollectors } from '../modules/collectors/service.js';
import { listRiskFlags } from '../modules/risk-flags/service.js';
import { listThreads } from '../modules/messages/service.js';

interface Check {
  name: string;
  pass: boolean;
  detail: string;
}

const checks: Check[] = [];

function record(name: string, pass: boolean, detail: string): void {
  checks.push({ name, pass, detail });
  console.log(`  ${pass ? '✓' : '✗'} ${name}: ${detail}`);
}

async function runHandler(name: string, fn: () => Promise<unknown>): Promise<void> {
  try {
    const result = await fn();
    const summary = Array.isArray(result)
      ? `items=${result.length}`
      : result && typeof result === 'object' && 'groups' in (result as object)
        ? `groups=${(result as { groups: unknown[] }).groups.length}`
        : result && typeof result === 'object' && 'collectors' in (result as object)
          ? `collectors=${(result as { collectors: unknown[] }).collectors.length}`
          : result && typeof result === 'object' && 'flags' in (result as object)
            ? `flags=${(result as { flags: unknown[] }).flags.length}`
            : 'ok';
    record(name, true, summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    record(name, false, message);
  }
}

async function main(): Promise<void> {
  console.log('RC1.3.3 Empty Database List Verification');
  console.log(`Started: ${new Date().toISOString()}`);

  if (!isDatabaseEnabled()) {
    console.error('DATABASE_URL is required.');
    process.exit(1);
  }

  const schema = await verifyCoreApplicationTables();
  record(
    'schema-core-tables',
    schema.status === 'ok',
    schema.missingTables.length
      ? `missing=${schema.missingTables.join(',')}`
      : 'all core tables present',
  );

  if (schema.status !== 'ok') {
    console.error('\nSchema incomplete — run migrations before list handler checks.');
    process.exit(1);
  }

  await runHandler('dashboard-summary', () => getDashboardSummary());
  await runHandler('borrowers-list', () => listBorrowerSummaries());
  await runHandler('loans-active', () => listLoans('ACTIVE'));
  await runHandler('loans-portfolio', () => listPortfolioEntries());
  await runHandler('loan-pools-list', () => listLoanPools());
  await runHandler('groups-list', () => listGroupsResponse());
  await runHandler('collectors-list', () => listCollectors());
  await runHandler('risk-flags-list', () => listRiskFlags());

  const adminUserId = process.env.EMPTY_DB_ADMIN_USER_ID?.trim();
  if (adminUserId) {
    await runHandler('messages-threads', () => listThreads(adminUserId));
  } else {
    record('messages-threads', true, 'skipped (set EMPTY_DB_ADMIN_USER_ID to verify)');
  }

  const passed = checks.filter((check) => check.pass).length;
  console.log(`\nPassed: ${passed}/${checks.length}`);

  if (passed !== checks.length) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
