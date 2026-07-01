import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../http/async-handler.js';
import { AppError, ERROR_CODE } from '../../http/errors.js';
import { sendData } from '../../http/response.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { validateBody } from '../../middleware/validate-body.js';
import * as messageService from './service.js';

const createThreadSchema = z.object({
  collectorId: z.string().uuid(),
  adminId: z.string().uuid().optional(),
});

const sendMessageSchema = z.object({
  body: z.string().min(1),
});

function mapError(error: unknown): never {
  if (error instanceof Error) {
    if (error.message === 'NOT_FOUND') {
      throw new AppError('Message thread not found.', ERROR_CODE.NOT_FOUND, 404);
    }
    if (error.message === 'UNAUTHORIZED') {
      throw new AppError('You do not have access to this thread.', ERROR_CODE.UNAUTHORIZED, 403);
    }
    if (error.message.startsWith('VALIDATION:')) {
      throw new AppError(error.message.replace(/^VALIDATION:/, ''), ERROR_CODE.VALIDATION, 422);
    }
  }
  throw error;
}

export const messagesRouter = Router();

messagesRouter.use(requireAuth);

messagesRouter.get(
  '/messages/threads',
  asyncHandler(async (req, res) => {
    try {
      sendData(res, await messageService.listThreads(req.session!.userId));
    } catch (error) {
      mapError(error);
    }
  }),
);

messagesRouter.post(
  '/messages/threads',
  validateBody(createThreadSchema),
  asyncHandler(async (req, res) => {
    try {
      const adminId = req.body.adminId ?? req.session!.userId;
      sendData(
        res,
        await messageService.getOrCreateThread(adminId, req.body.collectorId),
        201,
      );
    } catch (error) {
      mapError(error);
    }
  }),
);

messagesRouter.get(
  '/messages/threads/:id',
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await messageService.getThread(req.params.id!, req.session!.userId),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);

messagesRouter.post(
  '/messages/threads/:id/messages',
  validateBody(sendMessageSchema),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await messageService.sendMessage(
          req.params.id!,
          req.session!.userId,
          req.body.body,
        ),
        201,
      );
    } catch (error) {
      mapError(error);
    }
  }),
);
