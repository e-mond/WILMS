import { describe, expect, it } from 'vitest';
import { hashIdempotencyPayload } from '../../infrastructure/idempotency/run-with-idempotency.js';

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
