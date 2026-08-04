import { afterEach, describe, expect, it } from 'vitest';
import { resolveFeatureFlags, resetFeatureFlagsCache } from '../../config/feature-flags.js';

describe('feature flags', () => {
  afterEach(() => {
    resetFeatureFlagsCache();
    delete process.env.WILMS_FLAG_REQUIRE_IDEMPOTENCY;
    delete process.env.WILMS_FLAG_GL_DUAL_WRITE;
    delete process.env.WILMS_FLAG_DURABLE_QUEUES;
  });

  it('keeps glDualWrite false by default', () => {
    const flags = resolveFeatureFlags();
    expect(flags.glDualWrite).toBe(false);
  });

  it('honours env overrides', () => {
    process.env.WILMS_FLAG_REQUIRE_IDEMPOTENCY = 'true';
    process.env.WILMS_FLAG_DURABLE_QUEUES = 'false';
    const flags = resolveFeatureFlags();
    expect(flags.requireIdempotency).toBe(true);
    expect(flags.durableQueues).toBe(false);
  });
});
