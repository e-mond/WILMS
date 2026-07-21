import { Router } from 'express';
import { asyncHandler } from '../../http/async-handler.js';
import { AppError, ERROR_CODE } from '../../http/errors.js';
import { sendData } from '../../http/response.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import { permissionSetHasAny } from '../../infrastructure/permissions/resolve-user-permissions.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { getRequestPermissions } from '../../middleware/request-permissions.js';
import { requirePermission } from '../../middleware/require-permission.js';
import * as expenseService from './service.js';

function mapError(error: unknown): never {
  if (error instanceof Error && error.message === 'NOT_FOUND') {
    throw new AppError('Expense not found.', ERROR_CODE.NOT_FOUND, 404);
  }
  if (error instanceof Error && error.message.startsWith('FORBIDDEN:')) {
    throw new AppError(error.message.slice('FORBIDDEN:'.length), ERROR_CODE.FORBIDDEN, 403);
  }
  if (error instanceof Error && error.message.startsWith('VALIDATION:')) {
    throw new AppError(error.message.slice('VALIDATION:'.length), ERROR_CODE.VALIDATION, 422);
  }
  throw error;
}

export const expensesRouter = Router();

expensesRouter.use(requireAuth);

expensesRouter.get(
  '/expenses',
  requirePermission(PERMISSION.MANAGE_EXPENSES, PERMISSION.RECORD_EXPENSES),
  asyncHandler(async (req, res) => {
    const permissions = await getRequestPermissions(req);
    const canManageAll = permissionSetHasAny(permissions, [PERMISSION.MANAGE_EXPENSES]);
    sendData(
      res,
      await expenseService.listExpenses(
        canManageAll ? undefined : { recordedByUserId: req.session!.userId },
      ),
    );
  }),
);

expensesRouter.post(
  '/expenses',
  requirePermission(PERMISSION.RECORD_EXPENSES),
  asyncHandler(async (req, res) => {
    sendData(
      res,
      await expenseService.createExpense({
        ...req.body,
        recordedById: req.session!.userId,
        recordedByName: req.session!.displayName ?? req.body.recordedByName ?? 'Staff',
      }),
      201,
    );
  }),
);

expensesRouter.get(
  '/expenses/summary',
  requirePermission(PERMISSION.MANAGE_EXPENSES, PERMISSION.RECORD_EXPENSES),
  asyncHandler(async (req, res) => {
    const permissions = await getRequestPermissions(req);
    const canManageAll = permissionSetHasAny(permissions, [PERMISSION.MANAGE_EXPENSES]);
    sendData(
      res,
      await expenseService.getExpenseSummary(
        canManageAll ? undefined : { recordedByUserId: req.session!.userId },
      ),
    );
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
