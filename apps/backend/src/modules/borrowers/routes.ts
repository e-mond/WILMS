import { Router } from 'express';
import { asyncHandler } from '../../http/async-handler.js';
import { AppError, ERROR_CODE } from '../../http/errors.js';
import { sendData, sendPaginatedData } from '../../http/response.js';
import {
  buildPaginatedResult,
  parseListQuery,
  resolveListLimit,
  resolveListOffset,
} from '../../http/list-pagination.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import * as borrowerService from './service.js';
import { assertBorrowerReadAccess, assertBorrowerListAccess, resolveOfficerIdForList } from './access.js';
import { countBorrowers } from '../../db/persistence.js';

export const borrowersRouter = Router();

borrowersRouter.use(requireAuth);

function mapError(error: unknown): never {
  if (error instanceof Error) {
    if (error.message === 'NOT_FOUND') {
      throw new AppError('Borrower not found.', ERROR_CODE.NOT_FOUND, 404);
    }

    if (error.message === 'VALIDATION') {
      throw new AppError('Borrower is not in a valid state for this action.', ERROR_CODE.VALIDATION, 422);
    }

    if (error.message.startsWith('VALIDATION:')) {
      throw new AppError(error.message.slice('VALIDATION:'.length), ERROR_CODE.VALIDATION, 422);
    }

    if (error.message === 'DUPLICATE') {
      throw new AppError(
        'Admin fee has already been recorded for this borrower.',
        ERROR_CODE.DUPLICATE_TRANSACTION,
        409,
      );
    }

    if (error.message === 'UNAUTHORIZED') {
      throw new AppError('You cannot delete this registration.', ERROR_CODE.UNAUTHORIZED, 403);
    }

    if (error.message === 'FORBIDDEN') {
      throw new AppError('You do not have permission to view this registration.', ERROR_CODE.UNAUTHORIZED, 403);
    }
  }

  throw error;
}

borrowersRouter.get(
  '/borrowers',
  asyncHandler(async (req, res) => {
    try {
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      await assertBorrowerListAccess(req, status);

      if (status === 'PENDING') {
        sendData(res, await borrowerService.listPendingApplications());
        return;
      }

      const pagination = parseListQuery(req.query as Record<string, unknown>);
      if (pagination) {
        const items = await borrowerService.listBorrowerSummaries({
          limit: resolveListLimit(pagination),
          offset: resolveListOffset(pagination),
        });
        const total = await countBorrowers();
        sendPaginatedData(res, buildPaginatedResult(items, total, pagination));
        return;
      }

      sendData(res, await borrowerService.listBorrowerSummaries());
    } catch (error) {
      mapError(error);
    }
  }),
);

borrowersRouter.get(
  '/borrowers/my-registrations',
  requirePermission(PERMISSION.REGISTER_BORROWERS),
  asyncHandler(async (req, res) => {
    const officerId = resolveOfficerIdForList(
      req.session!,
      typeof req.query.officerId === 'string' ? req.query.officerId : undefined,
    );
    sendData(res, await borrowerService.listMyRegistrations(officerId));
  }),
);

borrowersRouter.get(
  '/borrowers/reviewed',
  requirePermission(PERMISSION.REVIEW_APPLICATIONS),
  asyncHandler(async (req, res) => {
    const approverId = String(req.query.approverId ?? req.session!.userId);
    sendData(res, await borrowerService.listReviewedApplications(approverId));
  }),
);

borrowersRouter.get(
  '/borrowers/check-phone',
  requirePermission(
    PERMISSION.REGISTER_BORROWERS,
    PERMISSION.EDIT_BORROWERS,
    PERMISSION.ACCESS_ADMIN_PORTAL,
    PERMISSION.APPROVE_BORROWERS,
  ),
  asyncHandler(async (req, res) => {
    sendData(res, await borrowerService.checkPhone(String(req.query.phone ?? '')));
  }),
);

borrowersRouter.get(
  '/borrowers/check-id',
  requirePermission(
    PERMISSION.REGISTER_BORROWERS,
    PERMISSION.EDIT_BORROWERS,
    PERMISSION.ACCESS_ADMIN_PORTAL,
    PERMISSION.APPROVE_BORROWERS,
  ),
  asyncHandler(async (req, res) => {
    sendData(
      res,
      await borrowerService.checkId(String(req.query.idType ?? ''), String(req.query.idNumber ?? '')),
    );
  }),
);

borrowersRouter.get(
  '/borrowers/check-name',
  requirePermission(
    PERMISSION.REGISTER_BORROWERS,
    PERMISSION.EDIT_BORROWERS,
    PERMISSION.ACCESS_ADMIN_PORTAL,
    PERMISSION.APPROVE_BORROWERS,
  ),
  asyncHandler(async (req, res) => {
    sendData(res, await borrowerService.checkName(String(req.query.fullName ?? '')));
  }),
);

borrowersRouter.get(
  '/borrowers/check-active-loan',
  requirePermission(
    PERMISSION.REGISTER_BORROWERS,
    PERMISSION.EDIT_BORROWERS,
    PERMISSION.ACCESS_ADMIN_PORTAL,
    PERMISSION.APPROVE_BORROWERS,
    PERMISSION.RECORD_COLLECTIONS,
  ),
  asyncHandler(async (req, res) => {
    sendData(res, await borrowerService.checkActiveLoan(String(req.query.phone ?? '')));
  }),
);

borrowersRouter.get(
  '/borrowers/check-blacklist',
  requirePermission(
    PERMISSION.REGISTER_BORROWERS,
    PERMISSION.EDIT_BORROWERS,
    PERMISSION.ACCESS_ADMIN_PORTAL,
    PERMISSION.APPROVE_BORROWERS,
  ),
  asyncHandler(async (req, res) => {
    sendData(
      res,
      await borrowerService.checkBlacklist({
        phone: req.query.phone ? String(req.query.phone) : undefined,
        idType: req.query.idType ? String(req.query.idType) : undefined,
        idNumber: req.query.idNumber ? String(req.query.idNumber) : undefined,
      }),
    );
  }),
);

borrowersRouter.post(
  '/borrowers/check-guarantor-eligibility',
  requirePermission(
    PERMISSION.REGISTER_BORROWERS,
    PERMISSION.EDIT_BORROWERS,
    PERMISSION.ACCESS_ADMIN_PORTAL,
    PERMISSION.APPROVE_BORROWERS,
  ),
  asyncHandler(async (req, res) => {
    sendData(res, await borrowerService.checkGuarantorEligibility(req.body ?? {}));
  }),
);

borrowersRouter.get(
  '/borrowers/drafts',
  requirePermission(PERMISSION.REGISTER_BORROWERS),
  asyncHandler(async (req, res) => {
    sendData(res, await borrowerService.listRegistrationDraftsForOfficer(req.session!.userId));
  }),
);

borrowersRouter.post(
  '/borrowers/drafts',
  requirePermission(PERMISSION.REGISTER_BORROWERS),
  asyncHandler(async (req, res) => {
    sendData(
      res,
      await borrowerService.createRegistrationDraft(
        req.session!.userId,
        (req.body?.draftPayload as Record<string, unknown>) ?? {},
      ),
      201,
    );
  }),
);

borrowersRouter.get(
  '/borrowers/drafts/:id',
  requirePermission(PERMISSION.REGISTER_BORROWERS),
  asyncHandler(async (req, res) => {
    try {
      sendData(res, await borrowerService.getRegistrationDraft(req.params.id!, req.session!.userId));
    } catch (error) {
      mapError(error);
    }
  }),
);

borrowersRouter.patch(
  '/borrowers/drafts/:id',
  requirePermission(PERMISSION.REGISTER_BORROWERS),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await borrowerService.updateRegistrationDraft(
          req.params.id!,
          req.session!.userId,
          (req.body?.draftPayload as Record<string, unknown>) ?? {},
          Number(req.body?.lastCompletedStep ?? 0),
        ),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);

borrowersRouter.delete(
  '/borrowers/drafts/:id',
  requirePermission(PERMISSION.REGISTER_BORROWERS),
  asyncHandler(async (req, res) => {
    try {
      await borrowerService.deleteRegistrationDraft(req.params.id!, req.session!.userId);
      sendData(res, { deleted: true });
    } catch (error) {
      mapError(error);
    }
  }),
);

borrowersRouter.post(
  '/borrowers/drafts/:id/submit',
  requirePermission(PERMISSION.REGISTER_BORROWERS),
  asyncHandler(async (req, res) => {
    try {
      sendData(res, await borrowerService.submitRegistrationDraft(req.params.id!, req.session!.userId), 201);
    } catch (error) {
      mapError(error);
    }
  }),
);

borrowersRouter.get(
  '/borrowers/awaiting-admin-fee',
  requirePermission(
    PERMISSION.ACCESS_ADMIN_PORTAL,
    PERMISSION.RECORD_COLLECTIONS,
    PERMISSION.MANAGE_SYSTEM_SETTINGS,
  ),
  asyncHandler(async (_req, res) => {
    try {
      const { listBorrowersAwaitingAdminFee } = await import('../transactions/service.js');
      sendData(res, await listBorrowersAwaitingAdminFee());
    } catch (error) {
      mapError(error);
    }
  }),
);

borrowersRouter.post(
  '/borrowers',
  requirePermission(PERMISSION.REGISTER_BORROWERS),
  asyncHandler(async (req, res) => {
    const result = await borrowerService.registerBorrower(req.body, req.session!.userId);
    sendData(res, result, 201);
  }),
);

borrowersRouter.delete(
  '/borrowers/:id/registration',
  requirePermission(PERMISSION.EDIT_PENDING_REGISTRATIONS),
  asyncHandler(async (req, res) => {
    try {
      await borrowerService.deleteRegistration(req.params.id!, String(req.query.officerId ?? req.session!.userId));
      res.status(204).end();
    } catch (error) {
      mapError(error);
    }
  }),
);

borrowersRouter.get(
  '/borrowers/:id/admin-fee-status',
  requirePermission(
    PERMISSION.ACCESS_ADMIN_PORTAL,
    PERMISSION.RECORD_COLLECTIONS,
    PERMISSION.MANAGE_SYSTEM_SETTINGS,
  ),
  asyncHandler(async (req, res) => {
    try {
      const { getAdminFeeStatus } = await import('../transactions/service.js');
      sendData(res, await getAdminFeeStatus(req.params.id!));
    } catch (error) {
      mapError(error);
    }
  }),
);

borrowersRouter.get(
  '/borrowers/:id',
  asyncHandler(async (req, res) => {
    try {
      await assertBorrowerReadAccess(req.session!, req.params.id!);
      sendData(res, await borrowerService.getBorrowerDetail(req.params.id!));
    } catch (error) {
      mapError(error);
    }
  }),
);

borrowersRouter.get(
  '/borrowers/:id/full-profile',
  asyncHandler(async (req, res) => {
    try {
      await assertBorrowerReadAccess(req.session!, req.params.id!);
      sendData(res, await borrowerService.getBorrowerFullProfile(req.params.id!));
    } catch (error) {
      mapError(error);
    }
  }),
);

borrowersRouter.get(
  '/borrowers/:id/review',
  asyncHandler(async (req, res) => {
    try {
      await assertBorrowerReadAccess(req.session!, req.params.id!);
      sendData(res, await borrowerService.getBorrowerReviewDetail(req.params.id!));
    } catch (error) {
      mapError(error);
    }
  }),
);

borrowersRouter.patch(
  '/borrowers/:id/approve',
  requirePermission(PERMISSION.APPROVE_BORROWERS),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await borrowerService.approveBorrower(
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

borrowersRouter.patch(
  '/borrowers/:id/reject',
  requirePermission(PERMISSION.APPROVE_BORROWERS),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await borrowerService.rejectBorrower(
          req.params.id!,
          String(req.body?.reason ?? ''),
          req.session!.userId,
          req.session!.displayName,
        ),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);

borrowersRouter.patch(
  '/borrowers/:id/blacklist',
  requirePermission(PERMISSION.APPROVE_BORROWERS),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await borrowerService.blacklistBorrower(
          req.params.id!,
          String(req.body?.reason ?? ''),
          req.session!.userId,
          req.session!.displayName,
        ),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);
