import { Router } from 'express';
import { asyncHandler } from '../../http/async-handler.js';
import { AppError, ERROR_CODE } from '../../http/errors.js';
import { sendData } from '../../http/response.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import * as overpaymentReviewService from './service.js';

function mapError(error: unknown): never {
  if (error instanceof Error) {
    if (error.message === 'NOT_FOUND') {
      throw new AppError('Overpayment review not found.', ERROR_CODE.NOT_FOUND, 404);
    }
    if (error.message.startsWith('VALIDATION:')) {
      throw new AppError(error.message.slice('VALIDATION:'.length), ERROR_CODE.VALIDATION, 422);
    }
    if (error.message.startsWith('FORBIDDEN:')) {
      throw new AppError(error.message.slice('FORBIDDEN:'.length), ERROR_CODE.FORBIDDEN, 403);
    }
  }
  throw error;
}

export const overpaymentReviewsRouter = Router();

overpaymentReviewsRouter.use(requireAuth);

overpaymentReviewsRouter.get(
  '/overpayment-reviews/pending',
  requirePermission(PERMISSION.ACCESS_ADMIN_PORTAL),
  asyncHandler(async (_req, res) => {
    sendData(res, overpaymentReviewService.listPendingReviews());
  }),
);

overpaymentReviewsRouter.post(
  '/overpayment-reviews',
  requirePermission(PERMISSION.RECORD_COLLECTIONS),
  asyncHandler(async (req, res) => {
    sendData(res, overpaymentReviewService.queueReview(req.body), 201);
  }),
);

overpaymentReviewsRouter.post(
  '/overpayment-reviews/:id/resolve',
  requirePermission(PERMISSION.ACCESS_ADMIN_PORTAL),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        overpaymentReviewService.resolveReview(
          req.params.id!,
          req.body,
          req.session!.userId,
          String(req.body?.actorDisplayName ?? req.session!.displayName),
        ),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);
