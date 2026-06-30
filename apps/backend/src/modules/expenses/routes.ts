import { Router } from 'express';
import { asyncHandler } from '../../http/async-handler.js';
import { AppError, ERROR_CODE } from '../../http/errors.js';
import { sendData } from '../../http/response.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import * as expenseService from './service.js';

function mapError(error: unknown): never {
  if (error instanceof Error && error.message === 'NOT_FOUND') {
    throw new AppError('Expense not found.', ERROR_CODE.NOT_FOUND, 404);
  }
  throw error;
}

export const expensesRouter = Router();

expensesRouter.use(requireAuth);

expensesRouter.get(
  '/expenses',
  requirePermission(PERMISSION.MANAGE_EXPENSES),
  asyncHandler(async (_req, res) => {
    sendData(res, await expenseService.listExpenses());
  }),
);

expensesRouter.post(
  '/expenses',
  requirePermission(PERMISSION.RECORD_EXPENSES),
  asyncHandler(async (req, res) => {
    sendData(res, await expenseService.createExpense(req.body), 201);
  }),
);

expensesRouter.get(
  '/expenses/summary',
  requirePermission(PERMISSION.MANAGE_EXPENSES),
  asyncHandler(async (_req, res) => {
    sendData(res, await expenseService.getExpenseSummary());
  }),
);

expensesRouter.patch(
  '/expenses/:id',
  requirePermission(PERMISSION.MANAGE_EXPENSES),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await expenseService.reviewExpense(req.params.id!, req.body, req.session!.userId),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);
