import rateLimit, { type Options, type Store, type ClientRateLimitInfo } from 'express-rate-limit';
import type { RequestHandler } from 'express';
import IORedis from 'ioredis';
import { env } from '../config/env.js';

/**
 * Redis-backed store for express-rate-limit when REDIS_URL / WILMS_REDIS_URL is set.
 * Shared across API instances. Without Redis, express-rate-limit uses its default
 * in-memory store (single-node only — same operational caveat as auth limiters).
 */
class RedisRateLimitStore implements Store {
  prefix: string;
  private client: IORedis;
  private windowMs = 60_000;

  constructor(client: IORedis, prefix = 'wilms:rl:') {
    this.client = client;
    this.prefix = prefix;
  }

  init(options: Options): void {
    this.windowMs = options.windowMs;
  }

  async increment(key: string): Promise<ClientRateLimitInfo> {
    const redisKey = `${this.prefix}${key}`;
    const count = await this.client.incr(redisKey);
    if (count === 1) {
      await this.client.pexpire(redisKey, this.windowMs);
    }
    const ttl = await this.client.pttl(redisKey);
    const resetTime = new Date(Date.now() + (ttl > 0 ? ttl : this.windowMs));
    return { totalHits: count, resetTime };
  }

  async decrement(key: string): Promise<void> {
    await this.client.decr(`${this.prefix}${key}`);
  }

  async resetKey(key: string): Promise<void> {
    await this.client.del(`${this.prefix}${key}`);
  }

  async get(key: string): Promise<ClientRateLimitInfo | undefined> {
    const redisKey = `${this.prefix}${key}`;
    const totalHits = Number((await this.client.get(redisKey)) ?? 0);
    if (!totalHits) {
      return undefined;
    }
    const ttl = await this.client.pttl(redisKey);
    return {
      totalHits,
      resetTime: new Date(Date.now() + (ttl > 0 ? ttl : this.windowMs)),
    };
  }
}

function tryCreateRedisStore(): Store | undefined {
  if (!env.redisUrl) {
    return undefined;
  }
  try {
    const client = new IORedis(env.redisUrl, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      lazyConnect: false,
    });
    client.on('error', () => {
      // Connection errors are logged by ioredis; limiter will surface as 500 if Redis dies mid-flight.
    });
    return new RedisRateLimitStore(client);
  } catch {
    return undefined;
  }
}

const rateLimitedMessage = {
  error: {
    message: 'Too many requests. Please slow down and try again shortly.',
    code: 'RATE_LIMITED',
  },
};

function skipHealthAndMetrics(req: { path: string }): boolean {
  const path = req.path;
  return (
    path === '/health' ||
    path.startsWith('/health/') ||
    path === '/ops/metrics' ||
    path.startsWith('/ops/metrics')
  );
}

/**
 * Global API abuse protection (300 req / IP / minute by default).
 * Uses Redis when REDIS_URL is configured; otherwise in-memory (document for multi-instance).
 */
export function createApiRateLimiter(options?: {
  windowMs?: number;
  max?: number;
}): RequestHandler {
  const store = tryCreateRedisStore();
  return rateLimit({
    windowMs: options?.windowMs ?? 60_000,
    max: options?.max ?? 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: rateLimitedMessage,
    skip: skipHealthAndMetrics,
    ...(store ? { store } : {}),
  });
}

/** Tighter limiter for invitation accept abuse. */
export const invitationAbuseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many invitation attempts. Please try again later.',
      code: 'RATE_LIMITED',
    },
  },
});
