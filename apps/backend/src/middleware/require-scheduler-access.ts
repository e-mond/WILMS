/**
 * Scheduler access: WILMS_SCHEDULER_TOKEN (Bearer or x-wilms-scheduler-token)
 * for external cron, otherwise session + manage-communication-scheduler.
 */
import { timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { PERMISSION } from '@wilms/shared-rbac';
import { env } from '../config/env.js';
import { requireAuth } from './authenticate.js';
import { requirePermission } from './require-permission.js';

export function schedulerTokenMatches(presented: string, expected: string): boolean {
  const a = Buffer.from(presented);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

export function extractSchedulerToken(req: Request): string {
  const auth = req.header('authorization')?.trim() ?? '';
  const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
  const headerToken = req.header('x-wilms-scheduler-token')?.trim() ?? '';
  return bearer || headerToken;
}

/**
 * Allow external cron via WILMS_SCHEDULER_TOKEN, else authenticated operator
 * with MANAGE_COMMUNICATION_SCHEDULER.
 */
export function requireSchedulerAccess(req: Request, res: Response, next: NextFunction): void {
  const expected = env.schedulerToken;
  if (expected) {
    const presented = extractSchedulerToken(req);
    if (presented && schedulerTokenMatches(presented, expected)) {
      next();
      return;
    }
  }

  requireAuth(req, res, (authErr) => {
    if (authErr) {
      next(authErr);
      return;
    }
    requirePermission(PERMISSION.MANAGE_COMMUNICATION_SCHEDULER)(req, res, next);
  });
}
