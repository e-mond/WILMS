import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../http/async-handler.js';
import { AppError, ERROR_CODE } from '../../http/errors.js';
import { sendData } from '../../http/response.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import { validateBody } from '../../middleware/validate-body.js';
import * as riskFlagService from './service.js';

const createRiskFlagSchema = z.object({
  entityId: z.string().uuid(),
  entityName: z.string().min(1),
  entityType: z.enum(['BORROWER', 'GROUP', 'COLLECTOR', 'LOAN_POOL', 'APPLICATION']),
  flagType: z.enum(['MISSED_PAYMENT', 'DEFAULT', 'FRAUD_SUSPICION', 'DUPLICATE_ID', 'BLACKLISTED']),
  community: z.string().min(1),
  reason: z.string().optional(),
  officerName: z.string().optional(),
  arrearsPesewas: z.number().int().nonnegative().optional(),
});

const resolveRiskFlagSchema = z.object({
  reason: z.string().optional(),
});

const assignRiskFlagSchema = z.object({
  assignedToUserId: z.string().uuid(),
});

function mapError(error: unknown): never {
  if (error instanceof Error && error.message === 'NOT_FOUND') {
    throw new AppError('Risk flag not found.', ERROR_CODE.NOT_FOUND, 404);
  }
  if (error instanceof Error && error.message.startsWith('VALIDATION:')) {
    throw new AppError(error.message.replace(/^VALIDATION:/, ''), ERROR_CODE.VALIDATION, 422);
  }
  throw error;
}

export const riskFlagsRouter = Router();

riskFlagsRouter.use(requireAuth);
riskFlagsRouter.use(requirePermission(PERMISSION.REVIEW_RISK_FLAGS));

riskFlagsRouter.get(
  '/risk-flags',
  asyncHandler(async (_req, res) => {
    sendData(res, await riskFlagService.listRiskFlags());
  }),
);

riskFlagsRouter.post(
  '/risk-flags',
  validateBody(createRiskFlagSchema),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await riskFlagService.createRiskFlag(
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

riskFlagsRouter.get(
  '/risk-flags/:id',
  asyncHandler(async (req, res) => {
    try {
      sendData(res, await riskFlagService.getRiskFlag(req.params.id!));
    } catch (error) {
      mapError(error);
    }
  }),
);

riskFlagsRouter.patch(
  '/risk-flags/:id/escalate',
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await riskFlagService.escalateRiskFlag(
          req.params.id!,
          req.session!.userId,
          req.session!.displayName,
        ),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);

riskFlagsRouter.patch(
  '/risk-flags/:id/resolve',
  validateBody(resolveRiskFlagSchema),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await riskFlagService.resolveRiskFlag(
          req.params.id!,
          req.session!.userId,
          req.body.reason,
          req.session!.displayName,
        ),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);

riskFlagsRouter.patch(
  '/risk-flags/:id/assign',
  validateBody(assignRiskFlagSchema),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await riskFlagService.assignRiskFlag(
          req.params.id!,
          req.body.assignedToUserId,
          req.session!.userId,
          req.session!.displayName,
        ),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);
