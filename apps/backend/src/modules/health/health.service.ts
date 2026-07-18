import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sql } from 'drizzle-orm';
import { env } from '../../config/env.js';
import { getDb, isDatabaseEnabled } from '../../db/client.js';
import { validateUploadEnvironment } from '../../infrastructure/uploads/env-validation.js';
import { getIntegrationStatus } from '../../infrastructure/integrations/status.js';
import { verifyCoreApplicationTables } from '../../db/schema-health.js';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const startedAt = Date.now();

function readPackageVersion(): string {
  try {
    const raw = readFileSync(path.join(packageRoot, 'package.json'), 'utf8');
    return (JSON.parse(raw) as { version?: string }).version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

interface MigrationJournalSummary {
  expected: number;
  /** Max journal `when` (folderMillis). Drizzle applies migrations with when > last DB watermark. */
  latestWhen: number;
}

function readMigrationJournal(): MigrationJournalSummary {
  try {
    const raw = readFileSync(
      path.join(packageRoot, 'src/db/migrations/meta/_journal.json'),
      'utf8',
    );
    const journal = JSON.parse(raw) as { entries?: { when?: number }[] };
    const entries = journal.entries ?? [];
    const latestWhen = entries.reduce(
      (max, entry) => Math.max(max, Number(entry.when ?? 0)),
      0,
    );
    return { expected: entries.length, latestWhen };
  } catch {
    return { expected: 0, latestWhen: 0 };
  }
}

/**
 * Drizzle-kit migrates by watermark (MAX created_at / journal `when`), not by row count.
 * A historical gap in `__drizzle_migrations` can leave applied_count < journal length
 * even when every pending migration has already been applied.
 */
export function resolveMigrationHealthStatus(input: {
  expectedCount: number;
  appliedCount: number | null;
  latestAppliedMillis: number | null;
  latestJournalWhen: number;
}): 'ok' | 'degraded' | 'unknown' {
  if (input.expectedCount <= 0 || input.latestJournalWhen <= 0) {
    return 'unknown';
  }
  if (input.latestAppliedMillis == null || Number.isNaN(input.latestAppliedMillis)) {
    return 'unknown';
  }
  // Watermark caught up ⇒ migrate has nothing left to apply.
  if (input.latestAppliedMillis >= input.latestJournalWhen) {
    return 'ok';
  }
  return 'degraded';
}

function readExpectedMigrationCount(): number {
  return readMigrationJournal().expected;
}

export interface HealthReport {
  status: 'ok' | 'degraded';
  degradedReasons: string[];
  service: 'wilms-api';
  version: string;
  gitCommit: string | null;
  uptimeSeconds: number;
  environment: string;
  timestamp: string;
  database: {
    configured: boolean;
    connected: boolean;
    status: 'connected' | 'disconnected' | 'disabled';
  };
  migrations: {
    expected: number;
    applied: number | null;
    latestAppliedAt: string | null;
    latestJournalWhen: number | null;
    status: 'ok' | 'degraded' | 'unknown' | 'disabled';
    /** True when applied row count ≠ journal length (historical gap; watermark may still be current). */
    countGap: boolean;
  };
  uploads: {
    requestedProvider: string;
    activeProvider: string;
    valid: boolean;
    cloudinaryConfigured: boolean;
  };
  session: {
    provider: 'hmac-signed-token';
  };
  runtime: {
    nodeVersion: string;
    deployedAt: string | null;
    buildId: string | null;
  };
  schema: {
    status: 'ok' | 'degraded' | 'disabled';
    missingTables: string[];
  };
  integrations: {
    mail: { provider: string; configured: boolean };
    sms: { provider: string; configured: boolean };
    notifications: { inApp: 'available'; push: 'optional'; email: 'optional' | 'configured'; sms: 'optional' | 'configured' };
  };
  workers: {
    redis: 'not_used' | 'configured';
    queue: 'in_process' | 'bullmq_available';
    scheduler: 'http_triggered';
  };
}

export async function buildHealthReport(): Promise<HealthReport> {
  const uploadReport = validateUploadEnvironment();
  const integrationReport = getIntegrationStatus();
  const schemaReport = await verifyCoreApplicationTables();
  const migrationJournal = readMigrationJournal();
  const expectedMigrations = migrationJournal.expected;
  let dbConnected = false;
  let appliedMigrations: number | null = null;
  let latestAppliedAt: string | null = null;
  let latestAppliedMillis: number | null = null;
  let migrationStatus: HealthReport['migrations']['status'] = 'disabled';
  let databaseStatus: HealthReport['database']['status'] = 'disabled';

  if (isDatabaseEnabled()) {
    databaseStatus = 'disconnected';
    migrationStatus = 'unknown';

    try {
      const db = getDb();
      await db.execute(sql`SELECT 1`);
      dbConnected = true;
      databaseStatus = 'connected';

      try {
        const result = await db.execute(sql`
          SELECT COUNT(*)::int AS count, MAX(created_at) AS latest
          FROM drizzle.__drizzle_migrations
        `);
        const rows = result.rows as { count?: number; latest?: string | Date | number }[];
        appliedMigrations = Number(rows[0]?.count ?? 0);
        const latest = rows[0]?.latest;
        if (latest instanceof Date) {
          latestAppliedMillis = latest.getTime();
          latestAppliedAt = latest.toISOString();
        } else if (typeof latest === 'string' || typeof latest === 'number') {
          latestAppliedMillis = Number(latest);
          const asDate = new Date(latestAppliedMillis);
          latestAppliedAt = Number.isNaN(asDate.getTime())
            ? String(latest)
            : asDate.toISOString();
        }
        migrationStatus = resolveMigrationHealthStatus({
          expectedCount: expectedMigrations,
          appliedCount: appliedMigrations,
          latestAppliedMillis,
          latestJournalWhen: migrationJournal.latestWhen,
        });
      } catch (error) {
        console.error('[health] migration count query failed:', error);
        migrationStatus = 'unknown';
      }
    } catch {
      dbConnected = false;
      databaseStatus = 'disconnected';
    }
  }

  // Also degrade when migration status cannot be determined with a live database —
  // unknown health must never look like a clean bill of health.
  const degraded =
    (isDatabaseEnabled() && !dbConnected) ||
    migrationStatus === 'degraded' ||
    migrationStatus === 'unknown' ||
    schemaReport.status === 'degraded' ||
    (env.nodeEnv === 'production' && !uploadReport.valid);

  const degradedReasons: string[] = [];
  if (isDatabaseEnabled() && !dbConnected) {
    degradedReasons.push('database_disconnected');
  }
  if (migrationStatus === 'degraded') {
    degradedReasons.push(
      `migrations_behind:applied_watermark=${latestAppliedMillis ?? 0},expected_watermark=${migrationJournal.latestWhen},applied_count=${appliedMigrations ?? 0},expected_count=${expectedMigrations}`,
    );
  }
  if (migrationStatus === 'unknown') {
    degradedReasons.push('migrations_status_unknown');
  }
  const migrationCountGap =
    appliedMigrations != null &&
    expectedMigrations > 0 &&
    appliedMigrations !== expectedMigrations;
  if (schemaReport.status === 'degraded') {
    degradedReasons.push(
      schemaReport.missingTables.length > 0
        ? `schema_missing_tables:${schemaReport.missingTables.join(',')}`
        : 'schema_probe_failed',
    );
  }
  if (env.nodeEnv === 'production' && !uploadReport.valid) {
    degradedReasons.push('upload_configuration_invalid');
  }

  return {
    status: degraded ? 'degraded' : 'ok',
    degradedReasons,
    service: 'wilms-api',
    version: readPackageVersion(),
    gitCommit: env.gitCommit ?? null,
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
    database: {
      configured: isDatabaseEnabled(),
      connected: dbConnected,
      status: databaseStatus,
    },
    migrations: {
      expected: expectedMigrations,
      applied: appliedMigrations,
      latestAppliedAt,
      latestJournalWhen: migrationJournal.latestWhen || null,
      status: migrationStatus,
      countGap: migrationCountGap,
    },
    uploads: {
      requestedProvider: uploadReport.provider,
      activeProvider: uploadReport.activeProvider,
      valid: uploadReport.valid,
      cloudinaryConfigured: uploadReport.activeProvider === 'cloudinary',
    },
    session: {
      provider: 'hmac-signed-token',
    },
    runtime: {
      nodeVersion: process.version,
      deployedAt: process.env.WILMS_DEPLOYED_AT?.trim() || null,
      buildId: process.env.RAILWAY_DEPLOYMENT_ID?.trim() || null,
    },
    schema: {
      status: schemaReport.status,
      missingTables: schemaReport.missingTables,
    },
    integrations: {
      mail: {
        provider: integrationReport.mail.provider,
        configured: integrationReport.mail.configured,
      },
      sms: {
        provider: integrationReport.sms.provider,
        configured: integrationReport.sms.configured,
      },
      notifications: {
        inApp: 'available',
        push: 'optional',
        email: integrationReport.mail.configured ? 'configured' : 'optional',
        sms: integrationReport.sms.configured ? 'configured' : 'optional',
      },
    },
    workers: {
      redis: process.env.REDIS_URL || process.env.WILMS_REDIS_URL ? 'configured' : 'not_used',
      queue:
        process.env.REDIS_URL || process.env.WILMS_REDIS_URL
          ? 'bullmq_available'
          : 'in_process',
      scheduler: 'http_triggered',
    },
  };
}

export function healthHttpStatus(report: HealthReport): number {
  // Railway deploy healthchecks require HTTP 2xx. Report schema/migration drift in the
  // JSON body (report.status) but only fail the probe when the API cannot reach the DB.
  if (report.database.configured && !report.database.connected) {
    return 503;
  }

  if (report.environment === 'production' && !report.uploads.valid) {
    return 503;
  }

  return 200;
}
