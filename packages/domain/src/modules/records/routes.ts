import { Router } from 'express';
import { asyncHandler } from '../../http/async-handler.js';
import { sendData } from '../../http/response.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import * as recordsService from './service.js';
import { assertBorrowerReadAccess } from '../borrowers/access.js';

export const recordsRouter = Router();

recordsRouter.use(requireAuth);

const recordsRead = [
  PERMISSION.ACCESS_ADMIN_PORTAL,
  PERMISSION.APPROVE_BORROWERS,
  PERMISSION.ACCESS_REGISTRATION_PORTAL,
  PERMISSION.ACCESS_AUDITOR_PORTAL,
  PERMISSION.VIEW_AUDIT_LOG,
] as const;

recordsRouter.get(
  '/records/search',
  requirePermission(...recordsRead),
  asyncHandler(async (req, res) => {
    sendData(res, await recordsService.searchRecords(String(req.query.q ?? ''), req.session!.role));
  }),
);

recordsRouter.get(
  '/records/borrowers/:id',
  requirePermission(...recordsRead),
  asyncHandler(async (req, res) => {
    await assertBorrowerReadAccess(req.session!, req.params.id!);
    sendData(res, await recordsService.getBorrowerRecordFile(req.params.id!));
  }),
);
