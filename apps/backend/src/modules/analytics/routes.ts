import { Router } from 'express';
import { asyncHandler } from '../../http/async-handler.js';
import { sendData } from '../../http/response.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import * as analyticsService from './service.js';

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth);
analyticsRouter.use(requirePermission(PERMISSION.VIEW_REPORTS));

analyticsRouter.get(
  '/analytics/collections',
  asyncHandler(async (req, res) => {
    sendData(
      res,
      await analyticsService.getCollectionMetrics({
        period: String(req.query.period ?? 'DAILY') as 'DAILY',
        scope: req.query.scope ? (String(req.query.scope) as 'ORGANISATION') : undefined,
        scopeId: req.query.scopeId ? String(req.query.scopeId) : undefined,
        referenceDate: req.query.referenceDate ? String(req.query.referenceDate) : undefined,
      }),
    );
  }),
);
