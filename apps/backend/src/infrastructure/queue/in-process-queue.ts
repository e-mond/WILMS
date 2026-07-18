/**
 * In-process fallback when Redis/BullMQ is unavailable.
 * Jobs run immediately with structured logging — not durable across restarts.
 */
import { getRequestId } from '../../middleware/request-id.js';
import { logger } from '../logging/logger.js';
import type { QueueJobEnvelope, QueueName, QueueStats } from './types.js';

type Handler = (job: QueueJobEnvelope) => Promise<void>;

const handlers = new Map<string, Handler>();
const stats = {
  waiting: 0,
  active: 0,
  completed: 0,
  failed: 0,
  delayed: 0,
};

export function registerInProcessHandler(jobType: string, handler: Handler): void {
  handlers.set(jobType, handler);
}

export async function enqueueInProcess(
  queue: QueueName,
  job: Omit<QueueJobEnvelope, 'createdAt' | 'correlationId'> & {
    correlationId?: string;
  },
): Promise<{ id: string; mode: 'in_process' }> {
  const envelope: QueueJobEnvelope = {
    ...job,
    createdAt: new Date().toISOString(),
    correlationId: job.correlationId ?? getRequestId(),
  };

  const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const handler = handlers.get(envelope.type);

  if (!handler) {
    logger.warn('queue.in_process.no_handler', { queue, type: envelope.type, id });
    stats.failed += 1;
    return { id, mode: 'in_process' };
  }

  stats.active += 1;
  try {
    await handler(envelope);
    stats.completed += 1;
    logger.info('queue.in_process.completed', {
      queue,
      type: envelope.type,
      id,
      correlationId: envelope.correlationId,
    });
  } catch (error) {
    stats.failed += 1;
    logger.error('queue.in_process.failed', {
      queue,
      type: envelope.type,
      id,
      correlationId: envelope.correlationId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  } finally {
    stats.active = Math.max(0, stats.active - 1);
  }

  return { id, mode: 'in_process' };
}

export function getInProcessQueueStats(): QueueStats {
  return {
    mode: 'in_process',
    redisConfigured: false,
    redisConnected: false,
    ...stats,
  };
}
