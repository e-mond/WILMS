/**
 * Verify Drizzle migration journal integrity before production migrate.
 *
 * Usage: npm run verify:migrations -w @wilms/api
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sql } from 'drizzle-orm';
import '../config/load-env.js';
import { getDb, isDatabaseEnabled } from '../db/client.js';
import { verifyCoreApplicationTables } from '../db/schema-health.js';
import { resolveMigrationHealthStatus } from '../modules/health/health.service.js';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const migrationsDir = path.join(packageRoot, 'src/db/migrations');
const journalPath = path.join(migrationsDir, 'meta/_journal.json');

interface JournalEntry {
  idx: number;
  tag: string;
  when?: number;
}

function loadJournal(): JournalEntry[] {
  const raw = readFileSync(journalPath, 'utf8');
  const journal = JSON.parse(raw) as { entries?: JournalEntry[] };
  return journal.entries ?? [];
}

function verifyJournal(entries: JournalEntry[]): boolean {
  let failed = false;

  console.log('WILMS Migration Journal Verification');
  console.log(`Journal entries: ${entries.length}`);

  for (const entry of entries) {
    const sqlPath = path.join(migrationsDir, `${entry.tag}.sql`);
    if (!existsSync(sqlPath)) {
      console.error(`  ✗ missing SQL file for journal tag ${entry.tag}`);
      failed = true;
      continue;
    }
    console.log(`  ✓ ${entry.idx.toString().padStart(2, '0')} ${entry.tag}`);
  }

  const tags = new Set(entries.map((entry) => entry.tag));
  const sqlFiles = readdirSync(migrationsDir).filter((name) => /^\d{4}_.*\.sql$/.test(name));
  for (const file of sqlFiles) {
    const tag = file.replace(/\.sql$/, '');
    if (!tags.has(tag)) {
      console.error(`  ✗ SQL file not in journal: ${file}`);
      failed = true;
    }
  }

  for (let index = 0; index < entries.length; index += 1) {
    if (entries[index]?.idx !== index) {
      console.error(`  ✗ journal idx gap at position ${index} (found idx ${entries[index]?.idx})`);
      failed = true;
      break;
    }
  }

  return !failed;
}

async function checkDatabaseState(entries: JournalEntry[]): Promise<boolean> {
  if (!isDatabaseEnabled()) {
    console.log('\nDatabase: skipped (DATABASE_URL not set)');
    return true;
  }

  const db = getDb();
  const result = await db.execute(sql`
    SELECT COUNT(*)::int AS count, MAX(created_at) AS latest
    FROM drizzle.__drizzle_migrations
  `);
  const rows = result.rows as { count?: number; latest?: string | Date | number }[];
  const applied = Number(rows[0]?.count ?? 0);
  const expected = entries.length;
  const latestJournalWhen = entries.reduce(
    (max, entry) => Math.max(max, Number(entry.when ?? 0)),
    0,
  );

  const latestRaw = rows[0]?.latest;
  let latestAppliedMillis: number | null = null;
  if (latestRaw instanceof Date) {
    latestAppliedMillis = latestRaw.getTime();
  } else if (typeof latestRaw === 'string' || typeof latestRaw === 'number') {
    latestAppliedMillis = Number(latestRaw);
  }

  const migrationStatus = resolveMigrationHealthStatus({
    expectedCount: expected,
    appliedCount: applied,
    latestAppliedMillis,
    latestJournalWhen,
  });
  const countGap = applied !== expected;
  const pendingByWatermark = entries.filter(
    (entry) => Number(entry.when ?? 0) > (latestAppliedMillis ?? 0),
  );

  console.log(`\nDatabase migration state:`);
  console.log(`  applied: ${applied}`);
  console.log(`  expected: ${expected}`);
  console.log(`  latest_applied_when: ${latestAppliedMillis ?? 'n/a'}`);
  console.log(`  latest_journal_when: ${latestJournalWhen}`);
  console.log(`  watermark_status: ${migrationStatus}`);
  if (countGap) {
    console.log(
      `  count_gap: yes (historical; drizzle migrates by watermark, not row count)`,
    );
  }

  if (pendingByWatermark.length > 0) {
    console.log('\nPending tags (journal when > applied watermark):');
    for (const entry of pendingByWatermark) {
      console.log(`  - ${entry.tag}`);
    }
  }

  const schemaReport = await verifyCoreApplicationTables();
  console.log(`\nSchema probe: ${schemaReport.status}`);
  if (schemaReport.missingTables.length > 0) {
    console.log(`  missing: ${schemaReport.missingTables.join(', ')}`);
  }

  return migrationStatus === 'ok' && schemaReport.status === 'ok';
}

async function main(): Promise<void> {
  const entries = loadJournal();
  const journalOk = verifyJournal(entries);

  if (!journalOk) {
    console.error('\nJournal integrity: FAIL');
    process.exit(1);
  }

  console.log('\nJournal integrity: PASS');

  const dbOk = await checkDatabaseState(entries);
  if (isDatabaseEnabled() && !dbOk) {
    console.error('\nDatabase migration/schema: NOT READY');
    process.exit(1);
  }

  if (isDatabaseEnabled()) {
    console.log('\nDatabase migration/schema: READY');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
