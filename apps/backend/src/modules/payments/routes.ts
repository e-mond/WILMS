import { Router } from 'express';
import { z } from 'zod';
import { isDatabaseEnabled } from '../../db/client.js';
import {
  appendPayment,
  findDuplicatePayment,
  findSameDayPayment,
  getBorrower,
  listPayments,
  nextPaymentId,
} from '../../db/persistence.js';
import { asyncHandler } from '../../http/async-handler.js';
import { AppError, ERROR_CODE } from '../../http/errors.js';
import { mapFinancialRouteError } from '../../http/map-financial-error.js';
import { sendData } from '../../http/response.js';
import { appendAuditEntry } from '../../infrastructure/audit/audit-log.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import { validateBody } from '../../middleware/validate-body.js';
import { assertBorrowerReadAccess } from '../borrowers/access.js';
import * as paymentReversalService from './payment-reversal.service.js';
import * as paymentService from './service.js';

const legacyRecordPaymentSchema = z.object({
  borrowerId: z.string().min(1),
  amountPesewas: z.number().int().positive(),
  paymentDate: z.string().min(1),
  collectorId: z.string().min(1),
  gps: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
      accuracyMeters: z.number().optional(),
    })
    .optional(),
});

function mapPaymentError(error: unknown): never {
  if (error instanceof Error && error.message === 'NOT_FOUND') {
    throw new AppError('Borrower or loan not found.', ERROR_CODE.NOT_FOUND, 404);
  }
  mapFinancialRouteError(error);
}

function mapReversalError(error: unknown): never {
  if (error instanceof Error && error.message === 'NOT_FOUND') {
    throw new AppError('Payment not found.', ERROR_CODE.NOT_FOUND, 404);
  }
  mapFinancialRouteError(error);
}

export const paymentsRouter = Router();

paymentsRouter.use(requireAuth);

async function assertCollectorPaymentAccess(
  session: NonNullable<Express.Request['session']>,
  borrowerId: string,
): Promise<void> {
  try {
    await assertBorrowerReadAccess(session, borrowerId);
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      throw new AppError('You do not have access to this borrower.', ERROR_CODE.UNAUTHORIZED, 403);
    }
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      throw new AppError('Borrower not found.', ERROR_CODE.NOT_FOUND, 404);
    }
    throw error;
  }
}

paymentsRouter.get(
  '/borrowers/:borrowerId/payment-entry',
  requirePermission(PERMISSION.RECORD_COLLECTIONS),
  asyncHandler(async (req, res) => {
    await assertCollectorPaymentAccess(req.session!, req.params.borrowerId!);

    if (isDatabaseEnabled()) {
      try {
        sendData(
          res,
          await paymentService.getPaymentEntryContext(
            req.params.borrowerId!,
            req.query.date ? String(req.query.date) : undefined,
          ),
        );
        return;
      } catch (error) {
        mapPaymentError(error);
      }
    }

    const borrower = await getBorrower(req.params.borrowerId!);

    if (!borrower) {
      throw new AppError('Borrower not found.', ERROR_CODE.NOT_FOUND, 404);
    }

    sendData(res, {
      borrowerId: borrower.id,
      borrowerName: borrower.fullName,
      groupName: borrower.groupName,
      expectedAmountPesewas: 5000,
      outstandingPesewas: borrower.hasActiveLoan ? 50000 : 0,
      referenceDate: String(req.query.date ?? new Date().toISOString().slice(0, 10)),
    });
  }),
);

paymentsRouter.get(
  '/payments/same-day',
  requirePermission(PERMISSION.RECORD_COLLECTIONS),
  asyncHandler(async (req, res) => {
    const borrowerId = String(req.query.borrowerId ?? '');
    if (!borrowerId) {
      throw new AppError('borrowerId is required.', ERROR_CODE.VALIDATION, 422);
    }

    await assertCollectorPaymentAccess(req.session!, borrowerId);

    const collectorId =
      req.session!.role === 'COLLECTOR'
        ? req.session!.userId
        : String(req.query.collectorId ?? req.session!.userId);

    const payment = await findSameDayPayment(
      borrowerId,
      collectorId,
      String(req.query.date ?? new Date().toISOString().slice(0, 10)),
    );
    sendData(res, payment ?? null);
  }),
);

paymentsRouter.get(
  '/payments/:paymentId',
  requirePermission(PERMISSION.RECORD_COLLECTIONS),
  asyncHandler(async (req, res) => {
    if (isDatabaseEnabled()) {
      try {
        const payment = await paymentService.getPaymentById(req.params.paymentId!);
        await assertCollectorPaymentAccess(req.session!, payment.borrowerId);
        sendData(res, payment);
        return;
      } catch (error) {
        mapPaymentError(error);
      }
    }

    const payment = (await listPayments()).find((entry) => entry.id === req.params.paymentId);

    if (!payment) {
      throw new AppError('Payment not found.', ERROR_CODE.NOT_FOUND, 404);
    }

    await assertCollectorPaymentAccess(req.session!, payment.borrowerId);

    sendData(res, {
      id: payment.id,
      borrowerId: payment.borrowerId,
      collectorId: payment.collectorId,
      amountPesewas: payment.amountPesewas,
      paymentDate: payment.paymentDate,
      recordedAt: payment.recordedAt,
      status: 'CONFIRMED',
      gps: payment.gps,
    });
  }),
);

paymentsRouter.post(
  '/payments',
  requirePermission(PERMISSION.RECORD_COLLECTIONS),
  validateBody(legacyRecordPaymentSchema),
  asyncHandler(async (req, res) => {
    const raw = req.body as z.infer<typeof legacyRecordPaymentSchema>;
    const input = {
      ...raw,
      collectorId:
        req.session!.role === 'COLLECTOR' ? req.session!.userId : raw.collectorId,
    };
    const idempotencyKey = req.header('Idempotency-Key') ?? undefined;

    if (req.session!.role === 'COLLECTOR') {
      try {
        await assertBorrowerReadAccess(req.session!, input.borrowerId);
      } catch (error) {
        if (error instanceof Error && error.message === 'FORBIDDEN') {
          throw new AppError(
            'You may only record payments for assigned borrowers.',
            ERROR_CODE.UNAUTHORIZED,
            403,
          );
        }
        throw error;
      }
    }

    if (isDatabaseEnabled()) {
      try {
        sendData(
          res,
          await paymentService.recordPayment(input, req.session!.userId, idempotencyKey),
          201,
        );
        return;
      } catch (error) {
        mapPaymentError(error);
      }
    }

    const duplicate = await findDuplicatePayment(input);

    if (duplicate) {
      throw new AppError(
        'This payment was already recorded for this borrower, date, and amount.',
        ERROR_CODE.DUPLICATE_TRANSACTION,
        409,
      );
    }

    const borrower = await getBorrower(input.borrowerId);

    if (!borrower) {
      throw new AppError('Borrower not found.', ERROR_CODE.NOT_FOUND, 404);
    }

    const payment = await appendPayment({
      id: nextPaymentId(),
      borrowerId: input.borrowerId,
      collectorId: input.collectorId,
      amountPesewas: input.amountPesewas,
      paymentDate: input.paymentDate,
      recordedAt: new Date().toISOString(),
      gps: input.gps,
    });

    appendAuditEntry({
      action: 'payment.recorded',
      actorId: req.session!.userId,
      targetEntityId: payment.id,
      targetEntityType: 'payment',
    });

    sendData(
      res,
      {
        id: payment.id,
        borrowerId: payment.borrowerId,
        collectorId: payment.collectorId,
        amountPesewas: payment.amountPesewas,
        paymentDate: payment.paymentDate,
        recordedAt: payment.recordedAt,
        status: 'RECORDED',
        gps: payment.gps,
      },
      201,
    );
  }),
);

paymentsRouter.post(
  '/payments/:paymentId/reverse',
  requirePermission(PERMISSION.ACCESS_ADMIN_PORTAL),
  validateBody(paymentReversalService.reversePaymentSchema),
  asyncHandler(async (req, res) => {
    if (!isDatabaseEnabled()) {
      throw new AppError(
        'Payment reversal requires database persistence.',
        ERROR_CODE.VALIDATION,
        422,
      );
    }

    try {
      const idempotencyKey = req.header('Idempotency-Key') ?? undefined;
      const body = req.body as z.infer<typeof paymentReversalService.reversePaymentSchema>;
      sendData(
        res,
        await paymentReversalService.reversePayment(
          req.params.paymentId!,
          {
            ...body,
            actorId: req.session!.userId,
            actorDisplayName: req.session!.displayName ?? body.actorDisplayName,
          },
          idempotencyKey,
        ),
      );
    } catch (error) {
      mapReversalError(error);
    }
  }),
);

/**
 * Posted payments are immutable. Corrections must use reverse + re-record.
 * Returning 409 (not a fake EDITED payload) prevents silent bookkeeping errors.
 */
paymentsRouter.patch(
  '/payments/:paymentId',
  requirePermission(PERMISSION.RECORD_COLLECTIONS, PERMISSION.ACCESS_ADMIN_PORTAL),
  asyncHandler(async (req, res) => {
    appendAuditEntry({
      action: 'payment.edit_rejected',
      actorId: req.session!.userId,
      targetEntityId: req.params.paymentId!,
      targetEntityType: 'payment',
      reason: 'immutable_ledger',
    });

    throw new AppError(
      'Posted payments cannot be edited. Reverse the payment and record a corrected collection.',
      ERROR_CODE.CONFLICT,
      409,
    );
  }),
);
