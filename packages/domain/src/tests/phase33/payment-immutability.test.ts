import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

describe('H5 payment immutability contract', () => {
  it('PATCH /payments/:id remains immutable ledger (409)', () => {
    const routesPath = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../modules/payments/routes.ts',
    );
    const source = readFileSync(routesPath, 'utf8');
    expect(source).toMatch(/Posted payments cannot be edited/);
    expect(source).toMatch(/immutable_ledger/);
    expect(source).toMatch(/ERROR_CODE\.CONFLICT/);
    expect(source).toMatch(/409/);
  });
});
