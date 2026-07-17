/**
 * P14.3B Phase 4C.3 — Reconciliation HTTP routes.
 *
 * RBAC: RECORD_COLLECTIONS for all reconciliation endpoints (v1).
 */
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../http/async-handler.js';
import { AppError, ERROR_CODE } from '../../http/errors.js';
import { mapFinancialRouteError } from '../../http/map-financial-error.js';
import { sendData } from '../../http/response.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import { validateBody } from '../../middleware/validate-body.js';
import * as reconciliationService from './service.js';

const submitReconciliationBodySchema = z.object({
  collectorId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  physicalCashPesewas: z.number().int().nonnegative(),
  comment: z.string().optional(),
});

function mapError(error: unknown): never {
  if (error instanceof Error && error.message === 'NOT_FOUND') {
    throw new AppError('Reconciliation not found.', ERROR_CODE.NOT_FOUND, 404);
  }
  mapFinancialRouteError(error);
}

export const reconciliationRouter = Router();

reconciliationRouter.use(requireAuth);

reconciliationRouter.get(
  '/reconciliation',
  requirePermission(PERMISSION.RECORD_COLLECTIONS),
  asyncHandler(async (req, res) => {
    const requestedCollectorId = String(req.query.collectorId ?? '');
    const date = String(req.query.date ?? '');
    const collectorId =
      req.session!.role === 'COLLECTOR' ? req.session!.userId : requestedCollectorId;

    if (!collectorId || !date) {
      throw new AppError(
        'collectorId and date query parameters are required.',
        ERROR_CODE.VALIDATION,
        422,
      );
    }

    if (
      req.session!.role === 'COLLECTOR' &&
      requestedCollectorId &&
      requestedCollectorId !== req.session!.userId
    ) {
      throw new AppError(
        'Collectors may only access their own reconciliation.',
        ERROR_CODE.UNAUTHORIZED,
        403,
      );
    }

    try {
      sendData(res, await reconciliationService.getReconciliationSummary(collectorId, date));
    } catch (error) {
      mapError(error);
    }
  }),
);

reconciliationRouter.get(
  '/reconciliations',
  requirePermission(PERMISSION.RECORD_COLLECTIONS, PERMISSION.VIEW_REPORTS),
  asyncHandler(async (req, res) => {
    const requestedCollectorId = req.query.collectorId ? String(req.query.collectorId) : undefined;
    const collectorId =
      req.session!.role === 'COLLECTOR' ? req.session!.userId : requestedCollectorId;

    try {
      sendData(res, await reconciliationService.listReconciliations({ collectorId }));
    } catch (error) {
      mapError(error);
    }
  }),
);

reconciliationRouter.get(
  '/reconciliations/:id',
  requirePermission(PERMISSION.RECORD_COLLECTIONS, PERMISSION.VIEW_REPORTS),
  asyncHandler(async (req, res) => {
    try {
      const summary = await reconciliationService.getReconciliationById(req.params.id!);
      if (!summary) {
        throw new AppError('Reconciliation not found.', ERROR_CODE.NOT_FOUND, 404);
      }
      if (
        req.session!.role === 'COLLECTOR' &&
        summary.collectorId !== req.session!.userId
      ) {
        throw new AppError(
          'Collectors may only access their own reconciliation.',
          ERROR_CODE.UNAUTHORIZED,
          403,
        );
      }
      sendData(res, summary);
    } catch (error) {
      mapError(error);
    }
  }),
);

reconciliationRouter.get(
  '/reconciliations/:id/history',
  requirePermission(PERMISSION.RECORD_COLLECTIONS),
  asyncHandler(async (req, res) => {
    try {
      sendData(res, await reconciliationService.getReconciliationHistory(req.params.id!));
    } catch (error) {
      mapError(error);
    }
  }),
);

reconciliationRouter.post(
  '/reconciliations',
  requirePermission(PERMISSION.RECORD_COLLECTIONS),
  validateBody(submitReconciliationBodySchema),
  asyncHandler(async (req, res) => {
    const { collectorId: requestedCollectorId, date, physicalCashPesewas, comment } = req.body;
    const collectorId =
      req.session!.role === 'COLLECTOR' ? req.session!.userId : requestedCollectorId;

    if (
      req.session!.role === 'COLLECTOR' &&
      requestedCollectorId &&
      requestedCollectorId !== req.session!.userId
    ) {
      throw new AppError(
        'Collectors may only submit their own reconciliation.',
        ERROR_CODE.UNAUTHORIZED,
        403,
      );
    }

    const idempotencyKey = req.header('Idempotency-Key') ?? req.header('idempotency-key') ?? undefined;

    try {
      sendData(
        res,
        await reconciliationService.submitReconciliation(
          {
            collectorId,
            reconciliationDate: date,
            physicalCashPesewas,
            comment,
            actorId: req.session!.userId,
            actorDisplayName: req.session!.displayName,
          },
          idempotencyKey,
        ),
        201,
      );
    } catch (error) {
      mapError(error);
    }
  }),
);

const reviewReconciliationBodySchema = z.object({
  status: z.enum([
    'PENDING_REVIEW',
    'UNDER_INVESTIGATION',
    'APPROVED',
    'REJECTED',
    'REOPENED',
  ]),
  resolutionNotes: z.string().optional(),
});

reconciliationRouter.patch(
  '/reconciliations/:id/review',
  requirePermission(PERMISSION.ACCESS_ADMIN_PORTAL),
  validateBody(reviewReconciliationBodySchema),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await reconciliationService.reviewReconciliation(req.params.id!, {
          status: req.body.status,
          resolutionNotes: req.body.resolutionNotes,
          reviewerUserId: req.session!.userId,
        }),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);
