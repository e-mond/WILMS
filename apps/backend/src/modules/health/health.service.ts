import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sql } from 'drizzle-orm';
import { env } from '../../config/env.js';
import { getDb, isDatabaseEnabled } from '../../db/client.js';
import { validateUploadEnvironment } from '../../infrastructure/uploads/env-validation.js';
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

function readExpectedMigrationCount(): number {
  try {
    const raw = readFileSync(
      path.join(packageRoot, 'src/db/migrations/meta/_journal.json'),
      'utf8',
    );
    const journal = JSON.parse(raw) as { entries?: unknown[] };
    return journal.entries?.length ?? 0;
  } catch {
    return 0;
  }
}

export interface HealthReport {
  status: 'ok' | 'degraded';
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
    status: 'ok' | 'degraded' | 'unknown' | 'disabled';
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
}

export async function buildHealthReport(): Promise<HealthReport> {
  const uploadReport = validateUploadEnvironment();
  const schemaReport = await verifyCoreApplicationTables();
  const expectedMigrations = readExpectedMigrationCount();
  let dbConnected = false;
  let appliedMigrations: number | null = null;
  let latestAppliedAt: string | null = null;
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
        const rows = result.rows as { count?: number; latest?: string | Date }[];
        appliedMigrations = Number(rows[0]?.count ?? 0);
        const latest = rows[0]?.latest;
        if (latest instanceof Date) {
          latestAppliedAt = latest.toISOString();
        } else if (typeof latest === 'string' || typeof latest === 'number') {
          const asDate = new Date(latest);
          latestAppliedAt = Number.isNaN(asDate.getTime()) ? String(latest) : asDate.toISOString();
        }
        migrationStatus =
          appliedMigrations >= expectedMigrations && expectedMigrations > 0 ? 'ok' : 'degraded';
      } catch (error) {
        console.error('[health] migration count query failed:', error);
        migrationStatus = 'unknown';
      }
    } catch {
      dbConnected = false;
      databaseStatus = 'disconnected';
    }
  }

  const degraded =
    (isDatabaseEnabled() && !dbConnected) ||
    migrationStatus === 'degraded' ||
    schemaReport.status === 'degraded' ||
    (env.nodeEnv === 'production' && !uploadReport.valid);

  return {
    status: degraded ? 'degraded' : 'ok',
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
      status: migrationStatus,
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
      buildId:
        process.env.RAILWAY_DEPLOYMENT_ID?.trim() ||
        process.env.RAILWAY_GIT_COMMIT_SHA?.trim() ||
        process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
        null,
    },
    schema: {
      status: schemaReport.status,
      missingTables: schemaReport.missingTables,
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
