/**
 * Server-controlled feature flags for v1.4 platform foundation.
 * Env-backed with safe defaults. No secrets. No client authorization.
 */
import { env } from './env.js';

function parseBool(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined || raw.trim() === '') {
    return fallback;
  }
  const normalized = raw.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }
  return fallback;
}

export interface FeatureFlags {
  /** Prefer BullMQ when Redis is configured; otherwise in-process fallback. */
  durableQueues: boolean;
  /** Require Idempotency-Key on money mutations (default true in production). */
  requireIdempotency: boolean;
  /** Prefer cursor pagination when clients send `cursor`. */
  cursorPagination: boolean;
  /** Write domain outbox rows inside money transactions. */
  outboxEnabled: boolean;
  /** Deliver outbox via queue/poller (at-least-once). */
  outboxDelivery: boolean;
  /** Emit OpenTelemetry-compatible span logs. */
  tracingEnabled: boolean;
  /** Stub for v1.5 GL dual-write — always false until GL ships. */
  glDualWrite: boolean;
}

export function resolveFeatureFlags(
  overrides: Partial<Record<keyof FeatureFlags, string | undefined>> = {},
): FeatureFlags {
  const production = env.nodeEnv === 'production';
  return {
    durableQueues: parseBool(
      overrides.durableQueues ?? process.env.WILMS_FLAG_DURABLE_QUEUES,
      Boolean(env.redisUrl),
    ),
    requireIdempotency: parseBool(
      overrides.requireIdempotency ?? process.env.WILMS_FLAG_REQUIRE_IDEMPOTENCY,
      production,
    ),
    cursorPagination: parseBool(
      overrides.cursorPagination ?? process.env.WILMS_FLAG_CURSOR_PAGINATION,
      true,
    ),
    outboxEnabled: parseBool(
      overrides.outboxEnabled ?? process.env.WILMS_FLAG_OUTBOX,
      true,
    ),
    outboxDelivery: parseBool(
      overrides.outboxDelivery ?? process.env.WILMS_FLAG_OUTBOX_DELIVERY,
      Boolean(env.redisUrl),
    ),
    tracingEnabled: parseBool(
      overrides.tracingEnabled ?? process.env.WILMS_FLAG_TRACING,
      true,
    ),
    glDualWrite: parseBool(
      overrides.glDualWrite ?? process.env.WILMS_FLAG_GL_DUAL_WRITE,
      false,
    ),
  };
}

let cached: FeatureFlags | null = null;

export function getFeatureFlags(): FeatureFlags {
  if (!cached) {
    cached = resolveFeatureFlags();
  }
  return cached;
}

/** Test helper — clears memoized flags. */
export function resetFeatureFlagsCache(): void {
  cached = null;
}
