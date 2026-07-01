import { Router } from 'express';
import { asyncHandler } from '../../http/async-handler.js';
import { sendData } from '../../http/response.js';
import { buildDailyCollectionReport } from '../../domain/reports/daily-collection.js';
import { buildLoanPortfolioReport } from '../../domain/reports/loan-portfolio.js';
import { buildDefaulterReport } from '../../domain/reports/defaulters.js';
import { buildCollectorPerformanceReport } from '../../domain/reports/collector-performance.js';
import { buildGroupRiskReport } from '../../domain/reports/group-risk.js';
import { buildFinancialLedgerReport } from '../../domain/reports/financial-ledger.js';
import { isDatabaseEnabled } from '../../db/client.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import { listBorrowers, listPayments } from '../../db/persistence.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import * as loanRepo from '../../repositories/loan.repository.js';
import * as userRepo from '../../repositories/user.repository.js';
import { mapLoanRowToDetail } from '../../domain/loan/mappers.js';
import { listPortfolioEntries } from '../loans/service.js';
import { listCollectors } from '../collectors/service.js';
import { listGroupsResponse } from '../groups/service.js';

type ReportCategory = 'collection' | 'portfolio' | 'risk' | 'compliance' | 'operations';

const REPORT_CATEGORY_LABELS: Record<ReportCategory, string> = {
  collection: 'Collection',
  portfolio: 'Portfolio',
  risk: 'Risk',
  compliance: 'Compliance',
  operations: 'Operations',
};

const REPORTS = [
  {
    id: 'daily-collection',
    title: 'Daily Collection Report',
    generatedAt: new Date().toISOString(),
    category: 'collection' as ReportCategory,
    description: 'Collections recorded by date and collector.',
    recordCount: 0,
    route: '/reports/daily-collection',
  },
  {
    id: 'loan-portfolio',
    title: 'Loan Portfolio Report',
    generatedAt: new Date().toISOString(),
    category: 'portfolio' as ReportCategory,
    description: 'Active and closed loan portfolio summary.',
    recordCount: 0,
    route: '/reports/loan-portfolio',
  },
  {
    id: 'defaulters',
    title: 'Defaulter Report',
    generatedAt: new Date().toISOString(),
    category: 'risk' as ReportCategory,
    description: 'Borrowers with consecutive missed payments and arrears.',
    recordCount: 0,
    route: '/reports/defaulters',
  },
  {
    id: 'collector-performance',
    title: 'Collector Performance Report',
    generatedAt: new Date().toISOString(),
    category: 'operations' as ReportCategory,
    description: 'Collection rates and field performance by collector.',
    recordCount: 0,
    route: '/reports/collector-performance',
  },
  {
    id: 'group-risk',
    title: 'Group Risk Report',
    generatedAt: new Date().toISOString(),
    category: 'risk' as ReportCategory,
    description: 'Group exposure, missed payments, and risk distribution.',
    recordCount: 0,
    route: '/reports/group-risk',
  },
  {
    id: 'financial-ledger',
    title: 'Financial Ledger Report',
    generatedAt: new Date().toISOString(),
    category: 'compliance' as ReportCategory,
    description: 'Immutable transaction ledger for disbursements and repayments.',
    recordCount: 0,
    route: '/reports/financial-ledger',
  },
  {
    id: 'audit-log',
    title: 'Audit Log Report',
    generatedAt: new Date().toISOString(),
    category: 'compliance' as ReportCategory,
    description: 'Immutable audit trail export.',
    recordCount: 0,
    route: '/reports/audit-log',
  },
];

function buildCategoryBreakdown() {
  const counts = REPORTS.reduce(
    (accumulator, entry) => {
      accumulator[entry.category] = (accumulator[entry.category] ?? 0) + 1;
      return accumulator;
    },
    {} as Record<ReportCategory, number>,
  );

  return (Object.keys(REPORT_CATEGORY_LABELS) as ReportCategory[]).map((category) => ({
    id: category,
    label: REPORT_CATEGORY_LABELS[category],
    count: counts[category] ?? 0,
  }));
}

function buildReportsHubMetadata() {
  return {
    scheduledReports: [] as { id: string; title: string; scheduleLabel: string }[],
    recentExports: [] as { id: string; label: string }[],
    lastComplianceExport: {
      exportedAt: new Date().toISOString(),
      exportedBy: 'System',
    },
    categoryBreakdown: buildCategoryBreakdown(),
  };
}

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
    sendData(res, buildReportsHubMetadata());
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
  asyncHandler(async (req, res) => {
    const entries = await listPortfolioEntries();
    const report = buildLoanPortfolioReport(entries, {
      search: req.query.search ? String(req.query.search) : undefined,
      status: req.query.status ? String(req.query.status) : undefined,
      cycleBatch: req.query.cycleBatch ? String(req.query.cycleBatch) : undefined,
    });
    sendData(res, report);
  }),
);

reportsRouter.get(
  '/reports/defaulters',
  asyncHandler(async (_req, res) => {
    const [loanRows, borrowers, payments] = await Promise.all([
      loanRepo.listLoans(),
      listBorrowers(),
      listPayments(),
    ]);
    const report = await buildDefaulterReport({ loanRows, borrowers, payments });
    sendData(res, report);
  }),
);

reportsRouter.get(
  '/reports/collector-performance',
  asyncHandler(async (_req, res) => {
    const collectorList = await listCollectors();
    const report = buildCollectorPerformanceReport(collectorList.collectors);
    sendData(res, report);
  }),
);

reportsRouter.get(
  '/reports/group-risk',
  asyncHandler(async (_req, res) => {
    const groupList = await listGroupsResponse();
    const report = buildGroupRiskReport(groupList.groups);
    sendData(res, report);
  }),
);

reportsRouter.get(
  '/reports/financial-ledger',
  asyncHandler(async (req, res) => {
    const payments = await listPayments();
    const report = buildFinancialLedgerReport(payments, {
      fromDate: req.query.fromDate ? String(req.query.fromDate) : undefined,
      toDate: req.query.toDate ? String(req.query.toDate) : undefined,
    });
    sendData(res, report);
  }),
);
