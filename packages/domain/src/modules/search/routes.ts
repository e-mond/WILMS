import { Router } from 'express';
import { asyncHandler } from '../../http/async-handler.js';
import { sendData } from '../../http/response.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import * as searchService from './service.js';

export const searchRouter = Router();

searchRouter.use(requireAuth);

searchRouter.get(
  '/search',
  requirePermission(
    PERMISSION.ACCESS_ADMIN_PORTAL,
    PERMISSION.ACCESS_COLLECTOR_PORTAL,
    PERMISSION.ACCESS_REGISTRATION_PORTAL,
    PERMISSION.ACCESS_APPROVER_PORTAL,
    PERMISSION.ACCESS_AUDITOR_PORTAL,
  ),
  asyncHandler(async (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    sendData(
      res,
      await searchService.globalSearch({
        query: String(req.query.q ?? ''),
        role: req.session!.role,
        limit: Number.isFinite(limit) ? limit : undefined,
      }),
    );
  }),
);
