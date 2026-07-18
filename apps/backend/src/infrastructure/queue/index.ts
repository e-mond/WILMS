import { getFeatureFlags } from '../../config/feature-flags.js';
import { env } from '../../config/env.js';
import { logger } from '../logging/logger.js';
import {
  enqueueBull,
  getBullQueueStats,
  isRedisConfigured,
  registerBullHandler,
  startBullWorkers,
  stopBullWorkers,
} from './bullmq-queue.js';
import {
  enqueueInProcess,
  getInProcessQueueStats,
  registerInProcessHandler,
} from './in-process-queue.js';
import type { QueueJobEnvelope, QueueName, QueueStats } from './types.js';

export type { QueueJobEnvelope, QueueName, QueueStats };

export function registerJobHandler(
  jobType: string,
  handler: (job: QueueJobEnvelope) => Promise<void>,
): void {
  registerInProcessHandler(jobType, handler);
  registerBullHandler(jobType, handler);
}

export async function enqueueJob(
  queue: QueueName,
  job: Omit<QueueJobEnvelope, 'createdAt'> & { createdAt?: string },
): Promise<{ id: string; mode: 'bullmq' | 'in_process' }> {
  const flags = getFeatureFlags();
  if (flags.durableQueues && isRedisConfigured()) {
    try {
      const result = await enqueueBull(queue, job);
      if (result) {
        return result;
      }
      logger.warn('queue.fallback_in_process', {
        reason: 'redis_unavailable',
        queue,
        type: job.type,
      });
    } catch (error) {
      logger.warn('queue.fallback_in_process', {
        reason: 'enqueue_error',
        queue,
        type: job.type,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return enqueueInProcess(queue, job);
}

export async function startQueueWorkers(): Promise<void> {
  const flags = getFeatureFlags();
  if (flags.durableQueues && isRedisConfigured()) {
    const started = await startBullWorkers();
    if (started) {
      logger.info('queue.mode', { mode: 'bullmq', redis: true });
      return;
    }
  }
  logger.info('queue.mode', {
    mode: 'in_process',
    redisConfigured: Boolean(env.redisUrl),
    durableFlag: flags.durableQueues,
  });
}

export async function stopQueueWorkers(): Promise<void> {
  await stopBullWorkers();
}

export async function getQueueStats(): Promise<QueueStats> {
  const flags = getFeatureFlags();
  if (flags.durableQueues && isRedisConfigured()) {
    const bull = await getBullQueueStats();
    if (bull) {
      return bull;
    }
  }
  return getInProcessQueueStats();
}
