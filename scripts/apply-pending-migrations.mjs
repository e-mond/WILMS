/**
 * Apply pending Drizzle SQL migrations against DATABASE_URL.
 *
 * Usage:
 *   DATABASE_URL=... node scripts/apply-pending-migrations.mjs
 *   node scripts/apply-pending-migrations.mjs --env-file apps/backend/.env.local
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrationsDir = path.join(root, 'packages/domain/src/db/migrations');
const journalPath = path.join(migrationsDir, 'meta/_journal.json');

function loadEnvFile(filePath) {
  const absolute = path.isAbsolute(filePath) ? filePath : path.join(root, filePath);
  if (!existsSync(absolute)) {
    throw new Error(`Env file not found: ${absolute}`);
  }
  const text = readFileSync(absolute, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
    const i = line.indexOf('=');
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env) || !process.env[key]) {
      process.env[key] = value;
    }
  }
}

function parseArgs(argv) {
  const args = { envFile: null };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--env-file') {
      args.envFile = argv[++i];
    }
  }
  return args;
}

function splitSqlStatements(sqlText) {
  const withoutBreaks = sqlText.replace(/-->\s*statement-breakpoint/g, '\n');
  const statements = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < withoutBreaks.length; i += 1) {
    const ch = withoutBreaks[i];
    const prev = withoutBreaks[i - 1];

    if (ch === "'" && !inDouble && prev !== '\\') {
      inSingle = !inSingle;
      current += ch;
      continue;
    }
    if (ch === '"' && !inSingle && prev !== '\\') {
      inDouble = !inDouble;
      current += ch;
      continue;
    }

    if (ch === ';' && !inSingle && !inDouble) {
      const trimmed = current
        .split('\n')
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n')
        .trim();
      if (trimmed) {
        statements.push(trimmed);
      }
      current = '';
      continue;
    }

    current += ch;
  }

  const trailing = current
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .trim();
  if (trailing) {
    statements.push(trailing);
  }

  return statements;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.envFile) {
    loadEnvFile(args.envFile);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const host = new URL(databaseUrl).hostname;
  console.log(`Connecting to ${host}`);

  const journal = JSON.parse(readFileSync(journalPath, 'utf8'));
  const sql = neon(databaseUrl);

  await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;
  await sql`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `;

  const applied = await sql`SELECT hash, created_at FROM drizzle.__drizzle_migrations`;
  const appliedHashes = new Set(applied.map((row) => row.hash));
  const maxWhen = applied.reduce((max, row) => {
    const value = Number(row.created_at ?? 0);
    return value > max ? value : max;
  }, 0);

  console.log(`Latest applied created_at=${maxWhen}`);

  let appliedCount = 0;
  let skippedCount = 0;

  for (const entry of journal.entries) {
    const filePath = path.join(migrationsDir, `${entry.tag}.sql`);
    if (!existsSync(filePath)) {
      throw new Error(`Missing migration file: ${filePath}`);
    }

    const content = readFileSync(filePath);
    const hash = createHash('sha256').update(content).digest('hex');

    if (appliedHashes.has(hash) || Number(entry.when) <= maxWhen) {
      skippedCount += 1;
      console.log(`skip ${entry.tag}`);
      continue;
    }

    console.log(`apply ${entry.tag}`);
    const statements = splitSqlStatements(content.toString('utf8'));
    for (const statement of statements) {
      await sql.query(statement);
    }

    await sql`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES (${hash}, ${entry.when})
    `;
    appliedHashes.add(hash);
    appliedCount += 1;
  }

  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
        'holiday_requests',
        'automation_rules',
        'automation_runs',
        'automation_tasks',
        'organization_holidays'
      )
    ORDER BY table_name
  `;

  const columns = await sql`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND (
        (table_name = 'organization_holidays' AND column_name IN ('source', 'enabled', 'year', 'external_key'))
        OR (table_name = 'holiday_requests' AND column_name IN ('notes', 'evidence_url', 'community', 'group_id', 'borrower_id'))
      )
    ORDER BY table_name, column_name
  `;

  console.log(
    JSON.stringify(
      {
        host,
        appliedCount,
        skippedCount,
        tables: tables.map((row) => row.table_name),
        columns: columns.map((row) => `${row.table_name}.${row.column_name}`),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
