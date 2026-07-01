import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../http/async-handler.js';
import { AppError, ERROR_CODE } from '../../http/errors.js';
import { sendData } from '../../http/response.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import { validateBody } from '../../middleware/validate-body.js';
import * as groupService from './service.js';

const createGroupSchema = z.object({
  name: z.string().min(1),
  community: z.string().min(1),
  displayName: z.string().optional(),
  collectorUserId: z.string().uuid().optional(),
  memberBorrowerIds: z.array(z.string().uuid()).optional(),
});

function mapError(error: unknown): never {
  if (error instanceof Error) {
    if (error.message === 'NOT_FOUND') {
      throw new AppError('Group not found.', ERROR_CODE.NOT_FOUND, 404);
    }
    if (error.message.startsWith('VALIDATION:')) {
      throw new AppError(error.message.slice('VALIDATION:'.length), ERROR_CODE.VALIDATION, 422);
    }
  }
  throw error;
}

export const groupsRouter = Router();

groupsRouter.use(requireAuth);
groupsRouter.use(requirePermission(PERMISSION.MANAGE_GROUPS));

groupsRouter.get(
  '/groups',
  asyncHandler(async (_req, res) => {
    sendData(res, await groupService.listGroupsResponse());
  }),
);

groupsRouter.post(
  '/groups',
  validateBody(createGroupSchema),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await groupService.createGroup(
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

groupsRouter.get(
  '/groups/:id',
  asyncHandler(async (req, res) => {
    try {
      sendData(res, await groupService.getGroupDetail(req.params.id!));
    } catch (error) {
      mapError(error);
    }
  }),
);

groupsRouter.post(
  '/groups/:id/flag',
  asyncHandler(async (req, res) => {
    try {
      sendData(res, await groupService.flagGroup({ groupId: req.params.id!, ...req.body }));
    } catch (error) {
      mapError(error);
    }
  }),
);

groupsRouter.post(
  '/groups/:id/reassign-collector',
  asyncHandler(async (req, res) => {
    try {
      sendData(res, await groupService.reassignCollector({ groupId: req.params.id!, ...req.body }));
    } catch (error) {
      mapError(error);
    }
  }),
);

groupsRouter.post(
  '/groups/:id/validate-removal',
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await groupService.validateMembershipRemoval({ groupId: req.params.id!, ...req.body }),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);

groupsRouter.post(
  '/groups/:id/remove-member',
  asyncHandler(async (req, res) => {
    try {
      sendData(res, await groupService.removeMember({ groupId: req.params.id!, ...req.body }));
    } catch (error) {
      mapError(error);
    }
  }),
);

groupsRouter.post(
  '/groups/:id/add-member',
  asyncHandler(async (req, res) => {
    try {
      sendData(res, await groupService.addMember({ groupId: req.params.id!, ...req.body }));
    } catch (error) {
      mapError(error);
    }
  }),
);

groupsRouter.post(
  '/groups/:id/transfer-member',
  asyncHandler(async (req, res) => {
    try {
      sendData(res, await groupService.transferMember({ groupId: req.params.id!, ...req.body }));
    } catch (error) {
      mapError(error);
    }
  }),
);

groupsRouter.post(
  '/groups/:id/replace-leader',
  asyncHandler(async (req, res) => {
    try {
      sendData(res, await groupService.replaceLeader({ groupId: req.params.id!, ...req.body }));
    } catch (error) {
      mapError(error);
    }
  }),
);

groupsRouter.post(
  '/groups/:id/display-name',
  asyncHandler(async (req, res) => {
    try {
      sendData(res, await groupService.updateDisplayName({ groupId: req.params.id!, ...req.body }));
    } catch (error) {
      mapError(error);
    }
  }),
);

groupsRouter.post(
  '/groups/:id/record-adjustment',
  asyncHandler(async (req, res) => {
    try {
      sendData(res, await groupService.recordAdjustment({ groupId: req.params.id!, ...req.body }));
    } catch (error) {
      mapError(error);
    }
  }),
);
