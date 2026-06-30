import { Router } from 'express';
import { asyncHandler } from '../../http/async-handler.js';
import { sendData } from '../../http/response.js';
import { buildDailyCollectionReport } from '../../domain/reports/daily-collection.js';
import { isDatabaseEnabled } from '../../db/client.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import { listBorrowers, listPayments } from '../../db/persistence.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import * as loanRepo from '../../repositories/loan.repository.js';
import * as userRepo from '../../repositories/user.repository.js';
import { mapLoanRowToDetail } from '../../domain/loan/mappers.js';

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
    const collectorId = req.query.collectorId ? String(req.query.collectorId) : undefined;

    const [payments, borrowers] = await Promise.all([listPayments(), listBorrowers()]);
    const borrowerNames = new Map(
      borrowers.map((borrower) => [
        borrower.id,
        { fullName: borrower.fullName, community: borrower.community },
      ]),
    );

    const collectorNameEntries: [string, string][] = [];
    if (isDatabaseEnabled()) {
      const users = await userRepo.listUsers();
      for (const user of users) {
        collectorNameEntries.push([user.id, user.displayName]);
      }
    } else {
      for (const payment of payments) {
        if (!collectorNameEntries.some(([id]) => id === payment.collectorId)) {
          collectorNameEntries.push([payment.collectorId, 'Collector']);
        }
      }
    }

    let loans: Parameters<typeof buildDailyCollectionReport>[0]['loans'];

    if (isDatabaseEnabled()) {
      const loanRows = await loanRepo.listLoans({ externalStatus: 'ACTIVE' });
      const borrowerById = new Map(borrowers.map((b) => [b.id, b]));
      loans = loanRows.map((row) => {
        const detail = mapLoanRowToDetail(row);
        const borrower = borrowerById.get(detail.borrowerId);
        return {
          id: detail.id,
          borrowerId: detail.borrowerId,
          borrowerName: borrower?.fullName ?? 'Unknown borrower',
          community: borrower?.community ?? '—',
          weeklyPaymentPesewas: detail.weeklyPaymentPesewas,
          paymentDay: detail.paymentDay,
          status: detail.status,
        };
      });
    }

    sendData(
      res,
      buildDailyCollectionReport({
        date,
        payments,
        loans,
        borrowerNames,
        collectorNames: new Map(collectorNameEntries),
        collectorId,
      }),
    );
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
