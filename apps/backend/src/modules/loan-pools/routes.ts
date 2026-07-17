import { Router } from 'express';
import { asyncHandler } from '../../http/async-handler.js';
import { AppError, ERROR_CODE } from '../../http/errors.js';
import { sendData } from '../../http/response.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import { validateBody } from '../../middleware/validate-body.js';
import * as poolService from './service.js';

function mapError(error: unknown): never {
  if (error instanceof Error && error.message === 'NOT_FOUND') {
    throw new AppError('Loan pool not found.', ERROR_CODE.NOT_FOUND, 404);
  }
  if (error instanceof Error && error.message.startsWith('VALIDATION')) {
    throw new AppError(error.message.replace(/^VALIDATION:/, ''), ERROR_CODE.VALIDATION, 422);
  }
  throw error;
}

export const loanPoolsRouter = Router();

loanPoolsRouter.use(requireAuth);

loanPoolsRouter.get(
  '/loan-pools',
  requirePermission(PERMISSION.VIEW_FINANCIAL_REPORTS),
  asyncHandler(async (_req, res) => {
    try {
      sendData(res, await poolService.listLoanPools());
    } catch (error) {
      mapError(error);
    }
  }),
);

loanPoolsRouter.post(
  '/loan-pools',
  requirePermission(PERMISSION.VIEW_FINANCIAL_REPORTS, PERMISSION.MANAGE_SYSTEM_SETTINGS),
  validateBody(poolService.createLoanPoolSchema),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await poolService.createLoanPool(
          req.body,
          req.session!.userId,
          req.session!.displayName,
        ),
        201,
      );
    } catch (error) {
      mapError(error);
    }
  }),
);

loanPoolsRouter.get(
  '/loan-pools/unassigned-groups',
  requirePermission(PERMISSION.VIEW_FINANCIAL_REPORTS, PERMISSION.MANAGE_SYSTEM_SETTINGS),
  asyncHandler(async (_req, res) => {
    try {
      sendData(res, await poolService.listUnassignedGroupsForPools());
    } catch (error) {
      mapError(error);
    }
  }),
);

loanPoolsRouter.get(
  '/loan-pools/:id',
  requirePermission(PERMISSION.VIEW_FINANCIAL_REPORTS),
  asyncHandler(async (req, res) => {
    try {
      sendData(res, await poolService.getLoanPool(req.params.id!));
    } catch (error) {
      mapError(error);
    }
  }),
);

loanPoolsRouter.post(
  '/loan-pools/:id/memberships',
  requirePermission(PERMISSION.VIEW_FINANCIAL_REPORTS, PERMISSION.MANAGE_SYSTEM_SETTINGS),
  validateBody(poolService.assignPoolMembershipSchema),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await poolService.assignPoolMembership(
          req.params.id!,
          req.body,
          req.session!.userId,
          req.session!.displayName,
        ),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);
