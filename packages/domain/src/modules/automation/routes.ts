import { Router } from 'express';
import { asyncHandler } from '../../http/async-handler.js';
import { sendData } from '../../http/response.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import * as automationService from './service.js';

export const automationRouter = Router();

automationRouter.use(requireAuth);

automationRouter.get(
  '/automation/rules',
  requirePermission(PERMISSION.MANAGE_SYSTEM_SETTINGS, PERMISSION.ACCESS_ADMIN_PORTAL),
  asyncHandler(async (_req, res) => {
    sendData(res, { rules: await automationService.listAutomationRules() });
  }),
);

automationRouter.get(
  '/automation/tasks',
  requirePermission(
    PERMISSION.MANAGE_SYSTEM_SETTINGS,
    PERMISSION.ACCESS_COLLECTOR_PORTAL,
    PERMISSION.ACCESS_ADMIN_PORTAL,
  ),
  asyncHandler(async (req, res) => {
    const mine = req.query.mine === '1';
    sendData(res, {
      tasks: await automationService.listOpenAutomationTasks(
        mine ? req.session!.userId : undefined,
      ),
    });
  }),
);

automationRouter.post(
  '/automation/run-daily',
  requirePermission(PERMISSION.MANAGE_SYSTEM_SETTINGS),
  asyncHandler(async (_req, res) => {
    sendData(res, await automationService.runDailyAutomationPass());
  }),
);

automationRouter.patch(
  '/automation/rules/:id',
  requirePermission(PERMISSION.MANAGE_SYSTEM_SETTINGS),
  asyncHandler(async (req, res) => {
    if (typeof req.body?.enabled !== 'boolean') {
      sendData(res, { error: 'enabled boolean required' });
      return;
    }
    try {
      sendData(
        res,
        await automationService.setAutomationRuleEnabled(req.params.id!, Boolean(req.body.enabled)),
      );
    } catch (error) {
      if (error instanceof Error && error.message === 'NOT_FOUND') {
        res.status(404);
        sendData(res, { error: 'Rule not found' });
        return;
      }
      throw error;
    }
  }),
);
