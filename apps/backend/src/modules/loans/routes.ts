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
import { PAYMENT_DAY_OPTIONS } from '../../domain/loan/payment-day.js';
import * as loanService from './service.js';

const createLoanSchema = z.object({
  borrowerId: z.string().min(1),
  amountPesewas: z.number().int().positive(),
  durationWeeks: z.number().int().min(1).max(52),
  paymentDay: z.enum(PAYMENT_DAY_OPTIONS),
  cycleBatch: z.string().trim().min(1).max(120),
  startDate: z.string().min(1),
  loanPoolId: z.string().uuid().optional(),
});

const rejectSchema = z.object({
  reason: z.string().min(1),
});

function mapError(error: unknown): never {
  if (error instanceof Error && error.message === 'NOT_FOUND') {
    throw new AppError('Resource not found.', ERROR_CODE.NOT_FOUND, 404);
  }
  mapFinancialRouteError(error);
}

export const loansRouter = Router();

loansRouter.use(requireAuth);

loansRouter.get(
  '/loans',
  requirePermission(PERMISSION.VIEW_FINANCIAL_REPORTS),
  asyncHandler(async (req, res) => {
    try {
      const status = req.query.status ? String(req.query.status) : undefined;
      sendData(res, await loanService.listLoans(status));
    } catch (error) {
      mapError(error);
    }
  }),
);

loansRouter.get(
  '/loans/portfolio',
  requirePermission(PERMISSION.VIEW_FINANCIAL_REPORTS),
  asyncHandler(async (_req, res) => {
    try {
      sendData(res, await loanService.listPortfolioEntries());
    } catch (error) {
      mapError(error);
    }
  }),
);

loansRouter.get(
  '/borrowers/loan-eligible',
  requirePermission(PERMISSION.APPROVE_LOANS),
  asyncHandler(async (_req, res) => {
    try {
      sendData(res, await loanService.listEligibleBorrowers());
    } catch (error) {
      mapError(error);
    }
  }),
);

loansRouter.get(
  '/borrowers/:borrowerId/loans',
  requirePermission(PERMISSION.VIEW_FINANCIAL_REPORTS),
  asyncHandler(async (req, res) => {
    try {
      sendData(res, await loanService.listBorrowerLoans(req.params.borrowerId!));
    } catch (error) {
      mapError(error);
    }
  }),
);

loansRouter.get(
  '/borrowers/:borrowerId/disbursement-eligibility',
  requirePermission(PERMISSION.APPROVE_LOANS),
  asyncHandler(async (req, res) => {
    try {
      sendData(res, await loanService.getDisbursementEligibility(req.params.borrowerId!));
    } catch (error) {
      mapError(error);
    }
  }),
);

loansRouter.get(
  '/loans/:id',
  requirePermission(PERMISSION.VIEW_FINANCIAL_REPORTS),
  asyncHandler(async (req, res) => {
    try {
      sendData(res, await loanService.getLoan(req.params.id!));
    } catch (error) {
      mapError(error);
    }
  }),
);

loansRouter.get(
  '/loans/:id/schedule',
  requirePermission(PERMISSION.VIEW_FINANCIAL_REPORTS),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await loanService.getLoanSchedule(
          req.params.id!,
          req.query.date ? String(req.query.date) : undefined,
        ),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);

loansRouter.get(
  '/loans/:id/progress',
  requirePermission(PERMISSION.VIEW_FINANCIAL_REPORTS),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await loanService.getLoanProgress(
          req.params.id!,
          req.query.date ? String(req.query.date) : undefined,
        ),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);

loansRouter.get(
  '/loans/:id/payments',
  requirePermission(PERMISSION.VIEW_FINANCIAL_REPORTS),
  asyncHandler(async (req, res) => {
    try {
      sendData(res, await loanService.listLoanPaymentLog(req.params.id!));
    } catch (error) {
      mapError(error);
    }
  }),
);

loansRouter.post(
  '/loans',
  requirePermission(PERMISSION.APPROVE_LOANS),
  validateBody(createLoanSchema),
  asyncHandler(async (req, res) => {
    try {
      const body = req.body as z.infer<typeof createLoanSchema>;
      sendData(res, await loanService.createLoan(body, req.session!.userId), 201);
    } catch (error) {
      mapError(error);
    }
  }),
);

loansRouter.patch(
  '/loans/:id/approve',
  requirePermission(PERMISSION.APPROVE_LOANS),
  asyncHandler(async (req, res) => {
    try {
      sendData(res, await loanService.approveLoan(req.params.id!, req.session!.userId));
    } catch (error) {
      mapError(error);
    }
  }),
);

loansRouter.patch(
  '/loans/:id/reject',
  requirePermission(PERMISSION.REJECT_LOANS),
  validateBody(rejectSchema),
  asyncHandler(async (req, res) => {
    try {
      const body = req.body as z.infer<typeof rejectSchema>;
      sendData(
        res,
        await loanService.rejectLoan(req.params.id!, body.reason, req.session!.userId),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);

loansRouter.post(
  '/loans/:id/disburse',
  requirePermission(PERMISSION.APPROVE_LOANS),
  asyncHandler(async (req, res) => {
    try {
      const idempotencyKey = req.header('Idempotency-Key') ?? undefined;
      sendData(
        res,
        await loanService.disburseLoan(req.params.id!, req.session!.userId, idempotencyKey),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);
