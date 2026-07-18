/**
 * BullMQ durable queues — used when REDIS_URL is set and durableQueues flag is on.
 */
import { Queue, Worker, type JobsOptions, type ConnectionOptions } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../../config/env.js';
import { getRequestId } from '../../middleware/request-id.js';
import { logger } from '../logging/logger.js';
import type { QueueJobEnvelope, QueueName, QueueStats } from './types.js';

const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 5,
  backoff: { type: 'exponential', delay: 2_000 },
  removeOnComplete: { count: 1_000 },
  removeOnFail: { count: 5_000 },
};

let connection: IORedis | null = null;
let connectionFailed = false;
const queues = new Map<string, Queue>();
const workers: Worker[] = [];

type Handler = (job: QueueJobEnvelope) => Promise<void>;
const handlers = new Map<string, Handler>();

export function registerBullHandler(jobType: string, handler: Handler): void {
  handlers.set(jobType, handler);
}

async function getConnection(): Promise<IORedis | null> {
  if (connectionFailed || !env.redisUrl) {
    return null;
  }
  if (connection) {
    return connection;
  }
  try {
    const conn = new IORedis(env.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      connectTimeout: 3_000,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1_000)),
    });
    conn.on('error', (error) => {
      logger.warn('queue.redis.error', { error: error.message });
    });
    // Wait briefly for ready; if it fails, fall back.
    await new Promise<void>((resolve, reject) => {
      const onReady = () => {
        cleanup();
        resolve();
      };
      const onError = (error: Error) => {
        cleanup();
        reject(error);
      };
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error('Redis connect timeout'));
      }, 3_000);
      const cleanup = () => {
        clearTimeout(timer);
        conn.off('ready', onReady);
        conn.off('error', onError);
      };
      if (conn.status === 'ready') {
        cleanup();
        resolve();
        return;
      }
      conn.once('ready', onReady);
      conn.once('error', onError);
    });
    connection = conn;
    return connection;
  } catch (error) {
    connectionFailed = true;
    logger.error('queue.redis.connect_failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    if (connection) {
      connection.disconnect();
      connection = null;
    }
    return null;
  }
}

function queueKey(name: QueueName): string {
  return `${env.queuePrefix}:${name}`;
}

async function getQueue(name: QueueName): Promise<Queue | null> {
  const conn = await getConnection();
  if (!conn) {
    return null;
  }
  const key = queueKey(name);
  let q = queues.get(key);
  if (!q) {
    q = new Queue(key, { connection: conn as ConnectionOptions });
    queues.set(key, q);
  }
  return q;
}

export async function enqueueBull(
  name: QueueName,
  job: Omit<QueueJobEnvelope, 'createdAt'> & { createdAt?: string },
): Promise<{ id: string; mode: 'bullmq' } | null> {
  const q = await getQueue(name);
  if (!q) {
    return null;
  }

  const envelope: QueueJobEnvelope = {
    ...job,
    createdAt: job.createdAt ?? new Date().toISOString(),
    correlationId: job.correlationId ?? getRequestId(),
  };

  const bullJob = await q.add(envelope.type, envelope, DEFAULT_JOB_OPTIONS);

  logger.info('queue.bullmq.enqueued', {
    queue: name,
    type: envelope.type,
    id: bullJob.id,
    correlationId: envelope.correlationId,
  });

  return { id: String(bullJob.id), mode: 'bullmq' };
}

export async function startBullWorkers(): Promise<boolean> {
  const conn = await getConnection();
  if (!conn) {
    return false;
  }

  const names: QueueName[] = ['mail', 'sms', 'export', 'scheduler', 'outbox'];
  for (const name of names) {
    const key = queueKey(name);
    const worker = new Worker(
      key,
      async (job) => {
        const envelope = job.data as QueueJobEnvelope;
        const handler = handlers.get(envelope.type);
        if (!handler) {
          logger.warn('queue.bullmq.no_handler', { queue: name, type: envelope.type });
          throw new Error(`No handler for job type ${envelope.type}`);
        }
        await handler({ ...envelope, attempt: job.attemptsMade + 1 });
      },
      {
        connection: conn as ConnectionOptions,
        concurrency: 5,
      },
    );

    worker.on('failed', (job, error) => {
      logger.error('queue.bullmq.failed', {
        queue: name,
        type: job?.name,
        id: job?.id,
        attempts: job?.attemptsMade,
        error: error.message,
      });
    });

    workers.push(worker);
  }

  logger.info('queue.bullmq.workers_started', { queues: names.length });
  return true;
}

export async function stopBullWorkers(): Promise<void> {
  await Promise.all(workers.map((w) => w.close()));
  workers.length = 0;
  await Promise.all([...queues.values()].map((q) => q.close()));
  queues.clear();
  if (connection) {
    connection.disconnect();
    connection = null;
  }
}

export async function getBullQueueStats(): Promise<QueueStats | null> {
  const q = await getQueue('mail');
  if (!q) {
    return null;
  }
  const counts = await q.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
  return {
    mode: 'bullmq',
    redisConfigured: true,
    redisConnected: true,
    waiting: counts.waiting ?? 0,
    active: counts.active ?? 0,
    completed: counts.completed ?? 0,
    failed: counts.failed ?? 0,
    delayed: counts.delayed ?? 0,
  };
}

export function isRedisConfigured(): boolean {
  return Boolean(env.redisUrl);
}
