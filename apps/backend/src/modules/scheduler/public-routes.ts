/**
 * HTTP-triggered scheduler endpoints for external cron.
 *
 * Mounted before routers with blanket requireAuth so WILMS_SCHEDULER_TOKEN
 * authentication is reachable without a browser session.
 */
import { Router } from 'express';
import { uuidv7 } from 'uuidv7';
import { asyncHandler } from '../../http/async-handler.js';
import { sendData } from '../../http/response.js';
import { requireSchedulerAccess } from '../../middleware/require-scheduler-access.js';
import { logger } from '../../infrastructure/logging/logger.js';
import { recordSchedulerRun } from '../../infrastructure/scheduler/scheduler-run-state.js';
import * as paymentSchedulerService from '../notifications/payment-scheduler.service.js';
import * as communicationsService from '../communications/service.js';

export const publicSchedulerRouter = Router();

publicSchedulerRouter.post(
  '/notifications/scheduler/run',
  requireSchedulerAccess,
  asyncHandler(async (req, res) => {
    const referenceDate =
      typeof req.body?.referenceDate === 'string' ? req.body.referenceDate : undefined;
    sendData(res, await paymentSchedulerService.processPaymentNotificationJobs(referenceDate));
  }),
);

publicSchedulerRouter.post(
  '/communications/scheduler/run',
  requireSchedulerAccess,
  asyncHandler(async (_req, res) => {
    const startedAt = new Date();
    const correlationId = uuidv7();
    logger.info('scheduler.communications.start', { correlationId });
    try {
      const processed = await communicationsService.processScheduledMessages();
      const durationMs = Date.now() - startedAt.getTime();
      recordSchedulerRun({
        kind: 'communications',
        startedAt: startedAt.toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs,
        success: true,
        correlationId,
        summary: { processed },
      });
      logger.info('scheduler.communications.complete', {
        correlationId,
        processed,
        durationMs,
      });
      sendData(res, { processed, correlationId, durationMs });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Communications scheduler failed';
      const durationMs = Date.now() - startedAt.getTime();
      recordSchedulerRun({
        kind: 'communications',
        startedAt: startedAt.toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs,
        success: false,
        correlationId,
        error: message,
      });
      logger.error('scheduler.communications.failed', { correlationId, error: message });
      throw error;
    }
  }),
);
