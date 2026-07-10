import { Router } from 'express';
import { asyncHandler } from '../../http/async-handler.js';
import { sendData } from '../../http/response.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import {
  getCommunityFormationStatus,
  getFormationConfig,
  processApprovedBorrower,
} from './service.js';

export const groupFormationRouter = Router();

groupFormationRouter.use(requireAuth);

const formationReadPermissions = [
  PERMISSION.MANAGE_GROUPS,
  PERMISSION.ACCESS_ADMIN_PORTAL,
  PERMISSION.APPROVE_BORROWERS,
  PERMISSION.REGISTER_BORROWERS,
] as const;

const formationWritePermissions = [
  PERMISSION.MANAGE_GROUPS,
  PERMISSION.ACCESS_ADMIN_PORTAL,
  PERMISSION.APPROVE_BORROWERS,
] as const;

groupFormationRouter.get(
  '/groups/formation/config',
  requirePermission(...formationReadPermissions),
  asyncHandler(async (_req, res) => {
    sendData(res, getFormationConfig());
  }),
);

groupFormationRouter.get(
  '/groups/formation/status/:community',
  requirePermission(...formationReadPermissions),
  asyncHandler(async (req, res) => {
    sendData(res, await getCommunityFormationStatus(decodeURIComponent(req.params.community!)));
  }),
);

groupFormationRouter.post(
  '/groups/formation/process-approval',
  requirePermission(...formationWritePermissions),
  asyncHandler(async (req, res) => {
    sendData(res, await processApprovedBorrower(req.body));
  }),
);
