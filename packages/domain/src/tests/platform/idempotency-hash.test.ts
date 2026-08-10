import { describe, expect, it, vi } from 'vitest';
import {
  hashIdempotencyPayload,
  runWithIdempotency,
} from '../../infrastructure/idempotency/run-with-idempotency.js';

describe('idempotency payload hash', () => {
  it('is stable for equivalent payloads', () => {
    expect(hashIdempotencyPayload({ a: 1, b: 2 })).toBe(hashIdempotencyPayload({ a: 1, b: 2 }));
  });

  it('differs when payload changes', () => {
    expect(hashIdempotencyPayload({ amount: 100 })).not.toBe(
      hashIdempotencyPayload({ amount: 200 }),
    );
  });
});

describe('runWithIdempotency memory-mode safety', () => {
  it('executes without calling getDb when DATABASE_URL is unset and no key is provided', async () => {
    vi.stubEnv('DATABASE_URL', '');
    await expect(
      runWithIdempotency({
        scope: 'EXPENSE_CREATE',
        actorUserId: 'actor-1',
        responseStatus: 201,
        execute: async () => ({ ok: true }),
      }),
    ).resolves.toEqual({ ok: true });
    vi.unstubAllEnvs();
  });
});
