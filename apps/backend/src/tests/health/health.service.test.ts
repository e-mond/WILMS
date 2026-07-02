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

describe('health.service', () => {
  it('returns ok when database is disabled in development', async () => {
    const report = await buildHealthReport();
    expect(report.status).toBe('ok');
    expect(report.service).toBe('wilms-api');
    expect(report.database.status).toBe('disabled');
    expect(healthHttpStatus(report)).toBe(200);
  });

  it('does not expose secrets in the health payload shape', async () => {
    const report = await buildHealthReport();
    expect(report).not.toHaveProperty('sessionSecret');
    expect(report.uploads).not.toHaveProperty('apiSecret');
  });
});
