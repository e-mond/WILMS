import { Router } from 'express';
import { asyncHandler } from '../../http/async-handler.js';
import { sendData } from '../../http/response.js';
import { buildHealthReport, healthHttpStatus } from './health.service.js';

export const healthRouter = Router();

healthRouter.get(
  '/health',
  asyncHandler(async (_req, res) => {
    const report = await buildHealthReport();
    sendData(res, report, healthHttpStatus(report));
  }),
);
