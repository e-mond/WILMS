/**
 * Lightweight OpenTelemetry-compatible span logging for v1.4.
 * Emits structured spans via the JSON logger; no collector required.
 * Never log secrets or unnecessary PII.
 */
import { randomUUID } from 'node:crypto';
import { getRequestId } from '../../middleware/request-id.js';
import { getFeatureFlags } from '../../config/feature-flags.js';
import { logger } from '../logging/logger.js';

export interface SpanAttributes {
  [key: string]: string | number | boolean | undefined;
}

const REDACT_KEYS = /password|secret|token|authorization|api[_-]?key|cookie|session/i;

function sanitizeAttributes(attrs: SpanAttributes = {}): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined) continue;
    if (REDACT_KEYS.test(key)) {
      out[key] = '[REDACTED]';
      continue;
    }
    out[key] = value;
  }
  return out;
}

export async function withSpan<T>(
  name: string,
  attrs: SpanAttributes,
  fn: () => Promise<T> | T,
): Promise<T> {
  const flags = getFeatureFlags();
  if (!flags.tracingEnabled) {
    return fn();
  }

  const spanId = randomUUID().slice(0, 16);
  const traceId = getRequestId() ?? randomUUID();
  const started = Date.now();
  logger.info('trace.span.start', {
    span: name,
    spanId,
    traceId,
    ...sanitizeAttributes(attrs),
  });

  try {
    const result = await fn();
    logger.info('trace.span.end', {
      span: name,
      spanId,
      traceId,
      durationMs: Date.now() - started,
      status: 'ok',
    });
    return result;
  } catch (error) {
    logger.error('trace.span.end', {
      span: name,
      spanId,
      traceId,
      durationMs: Date.now() - started,
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
