import { and, asc, eq, lte, sql } from 'drizzle-orm';
import { getDb, isDatabaseEnabled } from '../../db/client.js';
import { domainOutbox } from '../../db/schema/domain-outbox.js';
import { getFeatureFlags } from '../../config/feature-flags.js';
import { enqueueJob, registerJobHandler } from '../queue/index.js';
import { logger } from '../logging/logger.js';
import { withSpan } from '../observability/tracing.js';

const MAX_BATCH = 50;

export async function publishPendingOutbox(limit = MAX_BATCH): Promise<number> {
  if (!isDatabaseEnabled()) {
    return 0;
  }
  const flags = getFeatureFlags();
  if (!flags.outboxEnabled || !flags.outboxDelivery) {
    return 0;
  }

  return withSpan('outbox.publish_batch', { limit }, async () => {
    const db = getDb();
    const rows = await db
      .select()
      .from(domainOutbox)
      .where(
        and(eq(domainOutbox.status, 'PENDING'), lte(domainOutbox.availableAt, new Date())),
      )
      .orderBy(asc(domainOutbox.availableAt))
      .limit(limit);

    let published = 0;
    for (const row of rows) {
      try {
        await enqueueJob('outbox', {
          type: 'outbox.deliver',
          payload: {
            outboxId: row.id,
            eventType: row.eventType,
            eventVersion: row.eventVersion,
            aggregateType: row.aggregateType,
            aggregateId: row.aggregateId,
            payload: row.payload,
          },
          correlationId: row.correlationId ?? undefined,
        });
        await db
          .update(domainOutbox)
          .set({
            status: 'PROCESSING',
            attempts: sql`${domainOutbox.attempts} + 1`,
          })
          .where(eq(domainOutbox.id, row.id));
        published += 1;
      } catch (error) {
        await db
          .update(domainOutbox)
          .set({
            lastError: error instanceof Error ? error.message : String(error),
            attempts: sql`${domainOutbox.attempts} + 1`,
            availableAt: new Date(Date.now() + 30_000),
          })
          .where(eq(domainOutbox.id, row.id));
      }
    }

    return published;
  });
}

export function registerOutboxHandlers(): void {
  registerJobHandler('outbox.deliver', async (job) => {
    if (!isDatabaseEnabled()) {
      return;
    }
    const outboxId = String(job.payload.outboxId ?? '');
    const db = getDb();
    // At-least-once delivery: mark completed after successful handler.
    // Future GL dual-write consumers must be idempotent by outboxId.
    logger.info('outbox.delivered', {
      outboxId,
      eventType: job.payload.eventType,
      correlationId: job.correlationId,
    });
    await db
      .update(domainOutbox)
      .set({ status: 'COMPLETED', processedAt: new Date(), lastError: null })
      .where(eq(domainOutbox.id, outboxId));
  });

  registerJobHandler('outbox.poll', async () => {
    const count = await publishPendingOutbox();
    logger.info('outbox.poll.complete', { published: count });
  });
}
