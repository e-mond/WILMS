import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sql } from 'drizzle-orm';
import { env } from '../../config/env.js';
import { getDb, isDatabaseEnabled } from '../../db/client.js';
import { validateUploadEnvironment } from '../../infrastructure/uploads/env-validation.js';

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
}

export async function buildHealthReport(): Promise<HealthReport> {
  const uploadReport = validateUploadEnvironment();
  const expectedMigrations = readExpectedMigrationCount();
  let dbConnected = false;
  let appliedMigrations: number | null = null;
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
          SELECT COUNT(*)::int AS count FROM "__drizzle_migrations"
        `);
        const rows = result.rows as { count?: number }[];
        appliedMigrations = Number(rows[0]?.count ?? 0);
        migrationStatus =
          appliedMigrations >= expectedMigrations && expectedMigrations > 0 ? 'ok' : 'degraded';
      } catch {
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
    (env.nodeEnv === 'production' && !uploadReport.valid);

  return {
    status: degraded ? 'degraded' : 'ok',
    service: 'wilms-api',
    version: readPackageVersion(),
    gitCommit: process.env.WILMS_GIT_COMMIT?.trim() || null,
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
  };
}

export function healthHttpStatus(report: HealthReport): number {
  if (report.status === 'degraded') {
    return 503;
  }
  return 200;
}
