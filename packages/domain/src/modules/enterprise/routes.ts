import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../http/async-handler.js';
import { AppError, ERROR_CODE } from '../../http/errors.js';
import { sendData } from '../../http/response.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import { validateBody } from '../../middleware/validate-body.js';
import * as enterpriseService from './service.js';

function mapError(error: unknown): never {
  if (error instanceof Error) {
    if (error.message === 'NOT_FOUND') {
      throw new AppError('Resource not found.', ERROR_CODE.NOT_FOUND, 404);
    }
    if (error.message.startsWith('VALIDATION:')) {
      throw new AppError(error.message.slice('VALIDATION:'.length), ERROR_CODE.VALIDATION, 422);
    }
    if (error.message.startsWith('FORBIDDEN:')) {
      throw new AppError(error.message.slice('FORBIDDEN:'.length), ERROR_CODE.FORBIDDEN, 403);
    }
    if (error.message.startsWith('CONFLICT:')) {
      throw new AppError(error.message.slice('CONFLICT:'.length), ERROR_CODE.CONFLICT, 409);
    }
  }
  throw error;
}

export const enterpriseRouter = Router();

enterpriseRouter.use(requireAuth);

enterpriseRouter.post(
  '/borrowers/:id/relocate',
  requirePermission(PERMISSION.MANAGE_GROUPS, PERMISSION.MANAGE_SYSTEM_SETTINGS),
  validateBody(
    z.object({
      community: z.string().min(1),
      district: z.string().optional(),
      constituency: z.string().optional(),
      collectorUserId: z.string().uuid().nullable().optional(),
      reason: z.string().min(1),
    }),
  ),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await enterpriseService.relocateBorrower({
          borrowerId: req.params.id!,
          ...req.body,
          actorUserId: req.session!.userId,
        }),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);

enterpriseRouter.post(
  '/groups/:id/dissolve',
  requirePermission(PERMISSION.MANAGE_GROUPS),
  validateBody(
    z.object({
      reason: z.string().min(1),
      allowWithOutstanding: z.boolean().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await enterpriseService.dissolveGroup({
          groupId: req.params.id!,
          reason: req.body.reason,
          allowWithOutstanding: req.body.allowWithOutstanding,
          actorUserId: req.session!.userId,
        }),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);

enterpriseRouter.post(
  '/groups/:id/replace-member',
  requirePermission(PERMISSION.MANAGE_GROUPS),
  validateBody(
    z.object({
      outgoingBorrowerId: z.string().uuid(),
      incomingBorrowerId: z.string().uuid(),
      reason: z.string().min(1),
      autoApprove: z.boolean().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await enterpriseService.requestMemberReplacement({
          groupId: req.params.id!,
          ...req.body,
          actorUserId: req.session!.userId,
        }),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);

enterpriseRouter.post(
  '/group-member-replacements/:id/approve',
  requirePermission(PERMISSION.MANAGE_GROUPS, PERMISSION.APPROVE_BORROWERS),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await enterpriseService.approveMemberReplacement(req.params.id!, req.session!.userId),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);

enterpriseRouter.post(
  '/loans/:id/schedule-change',
  requirePermission(PERMISSION.MANAGE_SYSTEM_SETTINGS),
  validateBody(
    z.object({
      toPaymentDay: z.string().min(1),
      effectiveFrom: z.string().min(1),
      reason: z.string().min(1),
    }),
  ),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await enterpriseService.requestScheduleChange({
          loanId: req.params.id!,
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

enterpriseRouter.post(
  '/loans/:id/schedule-change/preview',
  requirePermission(PERMISSION.MANAGE_SYSTEM_SETTINGS, PERMISSION.APPROVE_BORROWERS),
  validateBody(
    z.object({
      toPaymentDay: z.string().min(1),
      effectiveFrom: z.string().min(1),
    }),
  ),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await enterpriseService.previewScheduleChange({
          loanId: req.params.id!,
          ...req.body,
        }),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);

enterpriseRouter.get(
  '/loans/:id/schedule-changes/pending',
  requirePermission(PERMISSION.APPROVE_BORROWERS, PERMISSION.MANAGE_SYSTEM_SETTINGS),
  asyncHandler(async (req, res) => {
    sendData(res, await enterpriseService.getPendingScheduleChangeForLoan(req.params.id!));
  }),
);

enterpriseRouter.get(
  '/loan-schedule-changes/pending',
  requirePermission(PERMISSION.APPROVE_BORROWERS, PERMISSION.MANAGE_SYSTEM_SETTINGS),
  asyncHandler(async (_req, res) => {
    sendData(res, await enterpriseService.listPendingScheduleChanges());
  }),
);

enterpriseRouter.post(
  '/loan-schedule-changes/:id/review',
  requirePermission(PERMISSION.APPROVE_BORROWERS),
  validateBody(z.object({ note: z.string().optional() })),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await enterpriseService.reviewScheduleChange({
          changeId: req.params.id!,
          actorUserId: req.session!.userId,
          note: req.body.note,
        }),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);

enterpriseRouter.post(
  '/loan-schedule-changes/:id/reject',
  requirePermission(PERMISSION.APPROVE_BORROWERS, PERMISSION.MANAGE_SYSTEM_SETTINGS),
  validateBody(z.object({ note: z.string().optional() })),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await enterpriseService.rejectScheduleChange({
          changeId: req.params.id!,
          actorUserId: req.session!.userId,
          note: req.body.note,
        }),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);

enterpriseRouter.post(
  '/loan-schedule-changes/:id/approve',
  requirePermission(PERMISSION.MANAGE_SYSTEM_SETTINGS),
  validateBody(z.object({ note: z.string().optional() })),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await enterpriseService.approveScheduleChange({
          changeId: req.params.id!,
          actorUserId: req.session!.userId,
          note: req.body.note,
        }),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);

enterpriseRouter.get(
  '/reports/write-offs',
  requirePermission(PERMISSION.VIEW_REPORTS, PERMISSION.VIEW_FINANCIAL_REPORTS),
  asyncHandler(async (_req, res) => {
    sendData(res, await enterpriseService.buildWriteOffReport());
  }),
);

enterpriseRouter.get(
  '/reports/aging-analysis',
  requirePermission(PERMISSION.VIEW_REPORTS, PERMISSION.VIEW_FINANCIAL_REPORTS),
  asyncHandler(async (_req, res) => {
    sendData(res, await enterpriseService.buildAgingAnalysisReport());
  }),
);
