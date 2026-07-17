import { timingSafeEqual } from 'node:crypto';
import { Router, type NextFunction, type Request, type Response } from 'express';
import { asyncHandler } from '../../http/async-handler.js';
import { sendData } from '../../http/response.js';
import { env } from '../../config/env.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import { buildOpsStatusReport, buildPrometheusMetrics } from './service.js';

export const opsRouter = Router();

function metricsTokenMatches(presented: string, expected: string): boolean {
  const a = Buffer.from(presented);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

/**
 * Allow Prometheus scrapers with WILMS_METRICS_TOKEN, otherwise require Super Admin.
 */
function requireMetricsAccess(req: Request, res: Response, next: NextFunction): void {
  const expected = env.metricsScrapeToken;
  if (expected) {
    const auth = req.header('authorization')?.trim() ?? '';
    const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
    const headerToken = req.header('x-wilms-metrics-token')?.trim() ?? '';
    const presented = bearer || headerToken;
    if (presented && metricsTokenMatches(presented, expected)) {
      next();
      return;
    }
  }

  requireAuth(req, res, (authErr) => {
    if (authErr) {
      next(authErr);
      return;
    }
    requirePermission(PERMISSION.ACCESS_ADMIN_PORTAL)(req, res, next);
  });
}

opsRouter.get(
  '/ops/status',
  requireAuth,
  requirePermission(PERMISSION.ACCESS_ADMIN_PORTAL),
  asyncHandler(async (_req, res) => {
    sendData(res, await buildOpsStatusReport());
  }),
);

opsRouter.get(
  '/ops/metrics',
  requireMetricsAccess,
  asyncHandler(async (_req, res) => {
    if (!env.metricsScrapeToken && env.nodeEnv === 'production') {
      res.setHeader('X-Wilms-Metrics-Auth', 'session');
    }
    const report = await buildOpsStatusReport();
    res
      .status(200)
      .type('text/plain; version=0.0.4; charset=utf-8')
      .send(buildPrometheusMetrics(report));
  }),
);
