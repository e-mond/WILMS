import { uuidv7 } from 'uuidv7';
import type { WilmsDb } from '../../db/client.js';
import { getDb, isDatabaseEnabled } from '../../db/client.js';
import { domainOutbox } from '../../db/schema/domain-outbox.js';
import { getFeatureFlags } from '../../config/feature-flags.js';
import { getRequestId } from '../../middleware/request-id.js';

export interface OutboxEventInput {
  eventType: string;
  eventVersion?: number;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  correlationId?: string;
}

export async function writeOutboxEvent(
  input: OutboxEventInput,
  tx: WilmsDb = getDb(),
): Promise<string | null> {
  const flags = getFeatureFlags();
  if (!flags.outboxEnabled || !isDatabaseEnabled()) {
    return null;
  }

  const id = uuidv7();
  await tx.insert(domainOutbox).values({
    id,
    eventType: input.eventType,
    eventVersion: input.eventVersion ?? 1,
    aggregateType: input.aggregateType,
    aggregateId: input.aggregateId,
    payload: input.payload,
    correlationId: input.correlationId ?? getRequestId() ?? null,
    status: 'PENDING',
    attempts: 0,
    availableAt: new Date(),
  });

  return id;
}
