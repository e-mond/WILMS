import { describe, expect, it, vi } from 'vitest';
import { buildHealthReport, healthHttpStatus } from '../../modules/health/health.service.js';

vi.mock('../../db/client.js', () => ({
  isDatabaseEnabled: () => false,
}));

vi.mock('../../infrastructure/uploads/env-validation.js', () => ({
  validateUploadEnvironment: () => ({
    provider: 'local',
    activeProvider: 'local',
    valid: true,
    warnings: [],
    errors: [],
  }),
}));

vi.mock('../../db/schema-health.js', () => ({
  verifyCoreApplicationTables: async () => ({ status: 'disabled', missingTables: [] }),
}));

vi.mock('../../infrastructure/integrations/status.js', () => ({
  getIntegrationStatus: () => ({
    sms: { provider: 'none', configured: false, setupHint: '' },
    mail: { provider: 'none', configured: false, setupHint: '' },
  }),
}));

describe('health.service', () => {
  it('returns ok when database is disabled in development', async () => {
    const report = await buildHealthReport();
    expect(report.status).toBe('ok');
    expect(report.degradedReasons).toEqual([]);
    expect(report.service).toBe('wilms-api');
    expect(report.database.status).toBe('disabled');
    expect(healthHttpStatus(report)).toBe(200);
  });

  it('does not expose secrets in the health payload shape', async () => {
    const report = await buildHealthReport();
    expect(report).not.toHaveProperty('sessionSecret');
    expect(report.uploads).not.toHaveProperty('apiSecret');
    expect(report.integrations.mail).not.toHaveProperty('setupHint');
    expect(report.workers.redis).toBe('not_used');
  });

  it('returns HTTP 200 when schema is degraded but database is connected', () => {
    const report = {
      status: 'degraded' as const,
      database: { configured: true, connected: true, status: 'connected' as const },
      uploads: { valid: true, requestedProvider: 'cloudinary', activeProvider: 'cloudinary', cloudinaryConfigured: true },
      environment: 'production',
      schema: { status: 'degraded' as const, missingTables: ['borrowers'] },
    };
    expect(healthHttpStatus(report as never)).toBe(200);
  });
});
