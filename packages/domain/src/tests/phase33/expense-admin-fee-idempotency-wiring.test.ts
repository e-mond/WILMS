import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('H1 expense and admin-fee idempotency wiring', () => {
  it('wires EXPENSE_CREATE through expenses service and routes', () => {
    const service = readFileSync(path.join(root, 'modules/expenses/service.ts'), 'utf8');
    const routes = readFileSync(path.join(root, 'modules/expenses/routes.ts'), 'utf8');
    expect(service).toContain("scope: 'EXPENSE_CREATE'");
    expect(service).toContain('runWithIdempotency');
    expect(routes).toContain('readIdempotencyKey');
  });

  it('wires ADMIN_FEE_RECORD through transactions service and routes', () => {
    const service = readFileSync(path.join(root, 'modules/transactions/service.ts'), 'utf8');
    const routes = readFileSync(path.join(root, 'modules/transactions/routes.ts'), 'utf8');
    expect(service).toContain("scope: 'ADMIN_FEE_RECORD'");
    expect(service).toContain('runWithIdempotency');
    expect(routes).toContain('readIdempotencyKey');
  });

  it('locks pool rows during disbursement hard-stop', () => {
    const service = readFileSync(path.join(root, 'modules/loans/service.ts'), 'utf8');
    expect(service).toContain('findPoolByIdForUpdate');
  });
});
