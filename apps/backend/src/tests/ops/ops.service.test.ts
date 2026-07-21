import { describe, expect, it, vi } from 'vitest';
import { buildOpsStatusReport, buildPrometheusMetrics } from '../../modules/ops/service.js';

vi.mock('../../db/client.js', () => ({
  isDatabaseEnabled: () => false,
}));

vi.mock('../../modules/health/health.service.js', () => ({
  buildHealthReport: async () => ({
    status: 'ok',
    degradedReasons: [],
    service: 'wilms-api',
    version: '1.4.0',
    gitCommit: 'abc1234deadbeef',
    uptimeSeconds: 42,
    environment: 'test',
    timestamp: new Date().toISOString(),
    database: { configured: false, connected: false, status: 'disabled' },
    migrations: {
      expected: 29,
      applied: null,
      latestAppliedAt: null,
      latestJournalWhen: null,
      status: 'disabled',
      countGap: false,
    },
    uploads: {
      requestedProvider: 'local',
      activeProvider: 'local',
      valid: true,
      cloudinaryConfigured: false,
    },
    session: { provider: 'hmac-signed-token' },
    runtime: { nodeVersion: 'v22.0.0', deployedAt: null, buildId: null },
    schema: { status: 'disabled', missingTables: [] },
    integrations: {
      mail: { provider: 'none', configured: false },
      sms: { provider: 'none', configured: false },
      notifications: { inApp: 'available', push: 'optional', email: 'optional', sms: 'optional' },
    },
    workers: { redis: 'not_used', queue: 'in_process', scheduler: 'http_triggered' },
  }),
}));

describe('ops.service', () => {
  it('builds an ops status report without secrets', async () => {
    const report = await buildOpsStatusReport();
    expect(report.deployment.version).toBe('1.4.0');
    expect(report.workers.redis).toBe('not_used');
    expect(report.workers.queue).toBe('in_process');
    expect(report.featureFlags).toBeTruthy();
    expect(report.backups.provider).toBe('neon');
    expect(report.surfaces.length).toBeGreaterThan(10);
    expect(JSON.stringify(report)).not.toMatch(/sessionSecret|API_SECRET|password/i);
  });

  it('exposes prometheus gauges', async () => {
    const report = await buildOpsStatusReport();
    const text = buildPrometheusMetrics(report);
    expect(text).toContain('wilms_health_up 1');
    expect(text).toContain('wilms_database_up 0');
    expect(text).toContain('wilms_queue_waiting');
    expect(text).toContain('wilms_scheduler_token_configured');
    expect(text).toContain('wilms_notifications_created');
    expect(text).toContain('wilms_info{version="1.4.0"} 1');
  });
});
