import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../http/async-handler.js';
import { AppError, ERROR_CODE } from '../../http/errors.js';
import { sendData } from '../../http/response.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import { validateBody } from '../../middleware/validate-body.js';
import * as intelligenceService from './service.js';

function mapError(error: unknown): never {
  if (error instanceof Error) {
    if (error.message === 'NOT_FOUND' || error.message.startsWith('NOT_FOUND:')) {
      throw new AppError('Resource not found.', ERROR_CODE.NOT_FOUND, 404);
    }
    if (error.message.startsWith('VALIDATION:')) {
      throw new AppError(error.message.slice('VALIDATION:'.length), ERROR_CODE.VALIDATION, 422);
    }
  }
  throw error;
}

export const intelligenceRouter = Router();

intelligenceRouter.use(requireAuth);

intelligenceRouter.get(
  '/intelligence/executive-dashboard',
  requirePermission(PERMISSION.ACCESS_ADMIN_PORTAL, PERMISSION.VIEW_REPORTS),
  asyncHandler(async (req, res) => {
    sendData(
      res,
      await intelligenceService.buildExecutiveDashboard({
        district: typeof req.query.district === 'string' ? req.query.district : undefined,
        community: typeof req.query.community === 'string' ? req.query.community : undefined,
        asOfDate: typeof req.query.asOf === 'string' ? req.query.asOf : undefined,
      }),
    );
  }),
);

intelligenceRouter.get(
  '/intelligence/forecast',
  requirePermission(PERMISSION.ACCESS_ADMIN_PORTAL, PERMISSION.VIEW_FINANCIAL_REPORTS),
  asyncHandler(async (req, res) => {
    const horizon = Number(req.query.horizonDays ?? 28);
    sendData(res, await intelligenceService.buildForecastSnapshot(Number.isFinite(horizon) ? horizon : 28));
  }),
);

intelligenceRouter.get(
  '/intelligence/portfolio-breakdown',
  requirePermission(PERMISSION.VIEW_REPORTS, PERMISSION.VIEW_FINANCIAL_REPORTS),
  asyncHandler(async (_req, res) => {
    sendData(res, await intelligenceService.buildPortfolioBreakdown());
  }),
);

intelligenceRouter.get(
  '/intelligence/compliance',
  requirePermission(PERMISSION.VIEW_AUDIT_LOG, PERMISSION.MANAGE_USERS),
  asyncHandler(async (_req, res) => {
    sendData(res, await intelligenceService.buildCompliancePack());
  }),
);

intelligenceRouter.get(
  '/intelligence/early-warnings',
  requirePermission(PERMISSION.ACCESS_ADMIN_PORTAL),
  asyncHandler(async (_req, res) => {
    sendData(res, await intelligenceService.listEarlyWarnings());
  }),
);

intelligenceRouter.post(
  '/intelligence/early-warnings/evaluate',
  requirePermission(PERMISSION.MANAGE_SYSTEM_SETTINGS, PERMISSION.ACCESS_ADMIN_PORTAL),
  asyncHandler(async (req, res) => {
    sendData(res, await intelligenceService.evaluateEarlyWarnings(req.session!.userId));
  }),
);

intelligenceRouter.get(
  '/intelligence/alert-thresholds',
  requirePermission(PERMISSION.MANAGE_SYSTEM_SETTINGS, PERMISSION.ACCESS_ADMIN_PORTAL),
  asyncHandler(async (_req, res) => {
    sendData(res, await intelligenceService.listAlertThresholds());
  }),
);

intelligenceRouter.put(
  '/intelligence/alert-thresholds',
  requirePermission(PERMISSION.MANAGE_SYSTEM_SETTINGS),
  validateBody(
    z.object({
      key: z.string().min(1),
      label: z.string().min(1),
      metric: z.string().min(1),
      operator: z.string().optional(),
      thresholdValue: z.number(),
      severity: z.string().optional(),
      enabled: z.boolean().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await intelligenceService.upsertAlertThreshold({
          ...req.body,
          actorUserId: req.session!.userId,
        }),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);

intelligenceRouter.get(
  '/exports/jobs',
  requirePermission(PERMISSION.ACCESS_ADMIN_PORTAL, PERMISSION.VIEW_REPORTS),
  asyncHandler(async (_req, res) => {
    sendData(res, await intelligenceService.listExportJobs());
  }),
);

intelligenceRouter.post(
  '/exports/jobs',
  requirePermission(PERMISSION.ACCESS_ADMIN_PORTAL, PERMISSION.VIEW_REPORTS),
  validateBody(
    z.object({
      entityType: z.string().min(1),
      format: z.enum(['CSV', 'EXCEL', 'PDF', 'DOCX']),
      filters: z.record(z.unknown()).optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await intelligenceService.createExportJob({
          entityType: req.body.entityType,
          format: req.body.format === 'DOCX' ? 'EXCEL' : req.body.format,
          filters: req.body.filters,
          actorUserId: req.session!.userId,
        }),
        201,
      );
    } catch (error) {
      mapError(error);
    }
  }),
);

intelligenceRouter.get(
  '/exports/jobs/:id',
  requirePermission(PERMISSION.ACCESS_ADMIN_PORTAL, PERMISSION.VIEW_REPORTS),
  asyncHandler(async (req, res) => {
    try {
      sendData(res, await intelligenceService.getExportJob(req.params.id!));
    } catch (error) {
      mapError(error);
    }
  }),
);

intelligenceRouter.delete(
  '/exports/jobs/:id',
  requirePermission(PERMISSION.ACCESS_ADMIN_PORTAL, PERMISSION.VIEW_REPORTS),
  asyncHandler(async (req, res) => {
    try {
      sendData(res, await intelligenceService.deleteExportJob(req.params.id!));
    } catch (error) {
      mapError(error);
    }
  }),
);

intelligenceRouter.post(
  '/exports/jobs/:id/regenerate',
  requirePermission(PERMISSION.ACCESS_ADMIN_PORTAL, PERMISSION.VIEW_REPORTS),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await intelligenceService.regenerateExportJob(req.params.id!, req.session!.userId),
        201,
      );
    } catch (error) {
      mapError(error);
    }
  }),
);

intelligenceRouter.get(
  '/ops/incidents',
  requirePermission(PERMISSION.MANAGE_SYSTEM_SETTINGS, PERMISSION.ACCESS_ADMIN_PORTAL),
  asyncHandler(async (_req, res) => {
    sendData(res, await intelligenceService.listIncidents());
  }),
);

intelligenceRouter.post(
  '/ops/incidents',
  requirePermission(PERMISSION.MANAGE_SYSTEM_SETTINGS),
  validateBody(
    z.object({
      title: z.string().min(1),
      severity: z.string().optional(),
      summary: z.string().optional(),
      ownerUserId: z.string().uuid().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await intelligenceService.createIncident({
          ...req.body,
          actorUserId: req.session!.userId,
        }),
        201,
      );
    } catch (error) {
      mapError(error);
    }
  }),
);

intelligenceRouter.post(
  '/ops/incidents/:id/acknowledge',
  requirePermission(PERMISSION.MANAGE_SYSTEM_SETTINGS),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await intelligenceService.acknowledgeIncident(req.params.id!, req.session!.userId),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);

intelligenceRouter.post(
  '/ops/incidents/:id/resolve',
  requirePermission(PERMISSION.MANAGE_SYSTEM_SETTINGS),
  validateBody(z.object({ resolution: z.string().min(1) })),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await intelligenceService.resolveIncident(
          req.params.id!,
          req.body.resolution,
          req.session!.userId,
        ),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);

intelligenceRouter.get(
  '/ops/maintenance',
  requirePermission(PERMISSION.ACCESS_ADMIN_PORTAL),
  asyncHandler(async (_req, res) => {
    sendData(res, await intelligenceService.listMaintenanceWindows());
  }),
);

intelligenceRouter.post(
  '/ops/maintenance',
  requirePermission(PERMISSION.MANAGE_SYSTEM_SETTINGS),
  validateBody(
    z.object({
      title: z.string().min(1),
      message: z.string().min(1),
      startsAt: z.string().min(1),
      endsAt: z.string().min(1),
    }),
  ),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await intelligenceService.createMaintenanceWindow({
          ...req.body,
          actorUserId: req.session!.userId,
        }),
        201,
      );
    } catch (error) {
      mapError(error);
    }
  }),
);
