#!/usr/bin/env node
/**
 * WILMS v1.4 — Backup / restore drill (isolated target only).
 *
 * NEVER point WILMS_RESTORE_DATABASE_URL at production.
 *
 * Usage:
 *   WILMS_BACKUP_DATABASE_URL=... WILMS_RESTORE_DATABASE_URL=... \
 *     node scripts/backup-restore-drill.mjs
 *
 * Without credentials, exits 0 with SKIPPED evidence (does not fabricate success).
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = path.join(root, 'docs/certification/v1.4/phase-25/evidence');
mkdirSync(outDir, { recursive: true });

const source = process.env.WILMS_BACKUP_DATABASE_URL?.trim();
const target = process.env.WILMS_RESTORE_DATABASE_URL?.trim();
const evidencePath = path.join(outDir, `backup-restore-drill-${stamp}.json`);

function looksLikeProduction(url) {
  const lower = url.toLowerCase();
  return lower.includes('prod') || lower.includes('production');
}

if (!source || !target) {
  const skipped = {
    status: 'SKIPPED',
    reason: 'WILMS_BACKUP_DATABASE_URL and WILMS_RESTORE_DATABASE_URL required',
    timestamp: new Date().toISOString(),
    note: 'Do not fabricate restore evidence. Provide isolated Neon branch URLs to run the drill.',
  };
  writeFileSync(evidencePath, JSON.stringify(skipped, null, 2));
  console.log('SKIPPED: missing backup/restore database URLs');
  console.log(`Evidence: ${evidencePath}`);
  process.exit(0);
}

if (looksLikeProduction(target)) {
  console.error('REFUSED: WILMS_RESTORE_DATABASE_URL appears to target production.');
  process.exit(2);
}

if (source === target) {
  console.error('REFUSED: backup and restore URLs must differ (isolated restore target).');
  process.exit(2);
}

const dumpPath = path.join(outDir, `wilms-drill-${stamp}.dump`);
const started = Date.now();

try {
  execFileSync(
    'pg_dump',
    [source, '--format=custom', '--no-owner', '--file', dumpPath],
    { stdio: 'inherit' },
  );
  execFileSync('pg_restore', ['--clean', '--if-exists', '--no-owner', '--dbname', target, dumpPath], {
    stdio: 'inherit',
  });

  const rtoSeconds = Math.round((Date.now() - started) / 1000);
  const evidence = {
    status: 'PASSED',
    timestamp: new Date().toISOString(),
    dumpPath: existsSync(dumpPath) ? dumpPath : null,
    rtoSeconds,
    rpoNote: 'RPO bounded by Neon PITR retention / dump start time — measure in ops calendar',
    targetIsProduction: false,
  };
  writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  console.log(`PASSED in ${rtoSeconds}s`);
  console.log(`Evidence: ${evidencePath}`);
} catch (error) {
  const evidence = {
    status: 'FAILED',
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? error.message : String(error),
  };
  writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  console.error('FAILED', evidence.error);
  process.exit(1);
}
