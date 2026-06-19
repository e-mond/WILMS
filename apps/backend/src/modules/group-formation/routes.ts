import { Router } from 'express';
import { asyncHandler } from '../../http/async-handler.js';
import { sendData } from '../../http/response.js';
import { requireAuth } from '../../middleware/authenticate.js';
import {
  getCommunityFormationStatus,
  getFormationConfig,
  processApprovedBorrower,
} from './service.js';

export const groupFormationRouter = Router();

groupFormationRouter.use(requireAuth);

groupFormationRouter.get(
  '/groups/formation/config',
  asyncHandler(async (_req, res) => {
    sendData(res, getFormationConfig());
  }),
);

groupFormationRouter.get(
  '/groups/formation/status/:community',
  asyncHandler(async (req, res) => {
    sendData(res, await getCommunityFormationStatus(decodeURIComponent(req.params.community!)));
  }),
);

groupFormationRouter.post(
  '/groups/formation/process-approval',
  asyncHandler(async (req, res) => {
    sendData(res, await processApprovedBorrower(req.body));
  }),
);
