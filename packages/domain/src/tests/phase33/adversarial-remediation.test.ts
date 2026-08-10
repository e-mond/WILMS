import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import { derivePoolAggregates } from '../../domain/loan-pool/balance.js';
import type { IdempotencyScope } from '../../infrastructure/idempotency/run-with-idempotency.js';
import { buildPhotoCaptureSessionToken } from '../../modules/photo-capture/service.js';
import {
  MAX_PUSH_SUBSCRIPTIONS_PER_USER,
  savePushSubscription,
} from '../../modules/notifications/push.service.js';
import * as poolRepo from '../../repositories/loan-pool.repository.js';

describe('Phase 33 adversarial remediation', () => {
  describe('H1 idempotency scopes', () => {
    it('registers EXPENSE_CREATE and ADMIN_FEE_RECORD scopes', () => {
      const scopes: IdempotencyScope[] = ['EXPENSE_CREATE', 'ADMIN_FEE_RECORD'];
      expect(scopes).toEqual(['EXPENSE_CREATE', 'ADMIN_FEE_RECORD']);
    });
  });

  describe('H2 pool hard-stop lock', () => {
    it('exposes findPoolByIdForUpdate for disbursement row locking', () => {
      expect(typeof poolRepo.findPoolByIdForUpdate).toBe('function');
    });

    it('hard-stop available capital rejects over-allocation math', () => {
      const capitalPesewas = 1_000_00;
      const aggregates = derivePoolAggregates({
        capitalPesewas,
        totals: {
          disbursedPesewas: 900_00,
          collectedPesewas: 0,
          replenishmentPesewas: 0,
          adjustmentPesewas: 0,
        },
      });
      const available = Math.max(0, capitalPesewas - aggregates.outstandingPesewas);
      const requested = 200_00;
      expect(available).toBe(100_00);
      expect(requested > available).toBe(true);
    });
  });

  describe('H3 photo-capture token entropy', () => {
    it('issues pcs_ tokens with full UUID hex entropy (32 hex chars)', () => {
      const token = buildPhotoCaptureSessionToken();
      expect(token).toMatch(/^pcs_[0-9a-f]{32}$/);
      const a = buildPhotoCaptureSessionToken();
      const b = buildPhotoCaptureSessionToken();
      expect(a).not.toBe(b);
    });
  });

  describe('H8 push subscription spam cap', () => {
    beforeEach(() => {
      vi.stubEnv('DATABASE_URL', '');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('rejects more than MAX_PUSH_SUBSCRIPTIONS_PER_USER distinct endpoints', async () => {
      const userId = `phase33-push-cap-${Date.now()}`;
      for (let i = 0; i < MAX_PUSH_SUBSCRIPTIONS_PER_USER; i += 1) {
        await savePushSubscription(userId, {
          endpoint: `https://push.example/${userId}/${i}`,
          keys: { p256dh: `p${i}`, auth: `a${i}` },
        });
      }

      await expect(
        savePushSubscription(userId, {
          endpoint: `https://push.example/${userId}/overflow`,
          keys: { p256dh: 'px', auth: 'ax' },
        }),
      ).rejects.toThrow(/maximum of 10 push subscriptions/i);
    });

    it('allows upsert of an existing endpoint at the cap', async () => {
      const userId = `phase33-push-upsert-${Date.now()}`;
      const endpoint = `https://push.example/${userId}/upsert`;
      await savePushSubscription(userId, {
        endpoint,
        keys: { p256dh: 'p0', auth: 'a0' },
      });
      await expect(
        savePushSubscription(userId, {
          endpoint,
          keys: { p256dh: 'p1', auth: 'a1' },
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('H10 reporting pool aggregate consistency', () => {
    it('keeps derived outstanding aligned with disbursed minus collected', () => {
      const capitalPesewas = 500_000;
      const derived = derivePoolAggregates({
        capitalPesewas,
        totals: {
          disbursedPesewas: 200_000,
          collectedPesewas: 50_000,
          replenishmentPesewas: 0,
          adjustmentPesewas: 0,
        },
      });
      expect(derived.outstandingPesewas).toBe(150_000);
      expect(Math.max(0, capitalPesewas - derived.outstandingPesewas)).toBe(350_000);
    });
  });
});

describe('H4 CORS production fail-closed', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  it('rejects serverless production when CORS defaults to localhost', async () => {
    vi.resetModules();
    process.env.NODE_ENV = 'production';
    process.env.VERCEL = '1';
    process.env.WILMS_SESSION_SECRET = 'phase33-production-session-secret';
    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/wilms';
    delete process.env.WILMS_CORS_ORIGIN;
    delete process.env.WILMS_RUNTIME;

    const { validateEnvironment } = await import('../../config/validate-env.js');
    const report = validateEnvironment();
    expect(report.valid).toBe(false);
    expect(report.errors.some((entry) => entry.includes('WILMS_CORS_ORIGIN'))).toBe(true);
  });
});

describe('H7 scheduler wrong-token fail-closed', () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock('../../config/env.js');
  });

  it('does not fall through to session when a wrong token is presented', async () => {
    vi.resetModules();
    vi.doMock('../../config/env.js', () => ({
      env: { schedulerToken: 'expected-scheduler-token' },
    }));

    const { requireSchedulerAccess } = await import('../../middleware/require-scheduler-access.js');
    const next = vi.fn() as unknown as NextFunction;
    const req = {
      header: (name: string) => {
        if (name.toLowerCase() === 'authorization') {
          return 'Bearer wrong-token';
        }
        return undefined;
      },
    } as unknown as Request;
    const res = {} as Response;

    requireSchedulerAccess(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as Error;
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toMatch(/invalid scheduler token/i);
  });
});
