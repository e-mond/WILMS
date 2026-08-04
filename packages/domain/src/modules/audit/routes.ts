import { Router } from 'express';
import { asyncHandler } from '../../http/async-handler.js';
import { sendData } from '../../http/response.js';
import { appendAuditEntry, listAuditEntries } from '../../infrastructure/audit/audit-log.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';

export const auditRouter = Router();

auditRouter.use(requireAuth);

auditRouter.post(
  '/audit',
  requirePermission(PERMISSION.VIEW_AUDIT_LOG),
  asyncHandler(async (req, res) => {
    const entry = appendAuditEntry({
      action: String(req.body.action ?? ''),
      actorId: req.session!.userId,
      actorDisplayName: req.session!.displayName,
      targetEntityId: String(req.body.targetEntityId ?? ''),
      targetEntityType: String(req.body.targetEntityType ?? ''),
      reason: req.body.reason ? String(req.body.reason) : undefined,
    });

    sendData(res, entry, 201);
  }),
);

auditRouter.get(
  '/audit-log',
  requirePermission(PERMISSION.VIEW_AUDIT_LOG),
  asyncHandler(async (req, res) => {
    sendData(
      res,
      await listAuditEntries({
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        action: req.query.action ? String(req.query.action) : undefined,
        actorId: req.query.actorId ? String(req.query.actorId) : undefined,
        fromDate: req.query.fromDate ? String(req.query.fromDate) : undefined,
        toDate: req.query.toDate ? String(req.query.toDate) : undefined,
      }),
    );
  }),
);
