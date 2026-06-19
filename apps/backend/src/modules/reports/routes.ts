import { Router } from 'express';
import { asyncHandler } from '../../http/async-handler.js';
import { sendData } from '../../http/response.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import { listPayments } from '../../db/persistence.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';

const REPORTS = [
  {
    id: 'daily-collection',
    title: 'Daily Collection Report',
    generatedAt: new Date().toISOString(),
    category: 'OPERATIONS',
    description: 'Collections recorded by date and collector.',
    recordCount: 0,
    route: '/reports/daily-collection',
  },
  {
    id: 'loan-portfolio',
    title: 'Loan Portfolio Report',
    generatedAt: new Date().toISOString(),
    category: 'FINANCIAL',
    description: 'Active and closed loan portfolio summary.',
    recordCount: 0,
    route: '/reports/loan-portfolio',
  },
  {
    id: 'audit-log',
    title: 'Audit Log Report',
    generatedAt: new Date().toISOString(),
    category: 'COMPLIANCE',
    description: 'Immutable audit trail export.',
    recordCount: 0,
    route: '/reports/audit-log',
  },
];

export const reportsRouter = Router();

reportsRouter.use(requireAuth);
reportsRouter.use(requirePermission(PERMISSION.VIEW_REPORTS));

reportsRouter.get(
  '/reports',
  asyncHandler(async (_req, res) => {
    sendData(res, REPORTS);
  }),
);

reportsRouter.get(
  '/reports/hub',
  asyncHandler(async (_req, res) => {
    const allPayments = await listPayments();
    sendData(res, {
      totalCollectionsPesewas: allPayments.reduce((sum, payment) => sum + payment.amountPesewas, 0),
      reportCount: REPORTS.length,
    });
  }),
);

reportsRouter.get(
  '/reports/daily-collection',
  asyncHandler(async (req, res) => {
    const date = String(req.query.date ?? new Date().toISOString().slice(0, 10));
    const payments = (await listPayments()).filter((payment) => payment.paymentDate === date);

    sendData(res, {
      date,
      rows: payments,
      totalPesewas: payments.reduce((sum, payment) => sum + payment.amountPesewas, 0),
    });
  }),
);

reportsRouter.get(
  '/reports/loan-portfolio',
  asyncHandler(async (_req, res) => {
    sendData(res, { rows: [], totals: { activeLoans: 0, outstandingPesewas: 0 } });
  }),
);

reportsRouter.get(
  '/reports/defaulters',
  asyncHandler(async (_req, res) => {
    sendData(res, { rows: [] });
  }),
);

reportsRouter.get(
  '/reports/collector-performance',
  asyncHandler(async (_req, res) => {
    sendData(res, { rows: [] });
  }),
);

reportsRouter.get(
  '/reports/group-risk',
  asyncHandler(async (_req, res) => {
    sendData(res, { rows: [] });
  }),
);

reportsRouter.get(
  '/reports/financial-ledger',
  asyncHandler(async (_req, res) => {
    sendData(res, { rows: [] });
  }),
);
