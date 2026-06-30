import { Router } from 'express';
import { asyncHandler } from '../../http/async-handler.js';
import { AppError, ERROR_CODE } from '../../http/errors.js';
import { sendData } from '../../http/response.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import * as photoCaptureService from './service.js';

export const photoCaptureRouter = Router();

photoCaptureRouter.use(requireAuth);
photoCaptureRouter.use(requirePermission(PERMISSION.CAPTURE_DOCUMENTS));

photoCaptureRouter.post(
  '/registration/capture-sessions',
  asyncHandler(async (req, res) => {
    sendData(res, photoCaptureService.createSession(req.body), 201);
  }),
);

photoCaptureRouter.get(
  '/registration/capture-sessions/:token',
  asyncHandler(async (req, res) => {
    const session = photoCaptureService.getSession(req.params.token!);
    if (!session) {
      throw new AppError('Capture session not found.', ERROR_CODE.NOT_FOUND, 404);
    }
    sendData(res, session);
  }),
);
