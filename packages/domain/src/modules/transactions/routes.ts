import { Router } from 'express';
import { asyncHandler } from '../../http/async-handler.js';
import { AppError, ERROR_CODE } from '../../http/errors.js';
import { sendData } from '../../http/response.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import * as transactionService from './service.js';

function mapError(error: unknown): never {
  if (error instanceof Error) {
    if (error.message === 'NOT_FOUND') {
      throw new AppError('Borrower not found.', ERROR_CODE.NOT_FOUND, 404);
    }
    if (error.message.startsWith('VALIDATION:')) {
      throw new AppError(error.message.slice('VALIDATION:'.length), ERROR_CODE.VALIDATION, 422);
    }
    if (error.message === 'DUPLICATE') {
      throw new AppError(
        'Admin fee has already been recorded for this borrower.',
        ERROR_CODE.DUPLICATE_TRANSACTION,
        409,
      );
    }
  }
  throw error;
}

export const transactionsRouter = Router();

transactionsRouter.use(requireAuth);

transactionsRouter.post(
  '/transactions/admin-fee',
  requirePermission(PERMISSION.RECORD_COLLECTIONS),
  asyncHandler(async (req, res) => {
    try {
      sendData(res, await transactionService.recordAdminFee(req.body), 201);
    } catch (error) {
      mapError(error);
    }
  }),
);
