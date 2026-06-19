import type { ReportCategory } from '@/types/reports';

export interface ReportCatalogEntry {
  id: string;
  title: string;
  generatedAt: string;
  category: ReportCategory;
  description: string;
  recordCount: number;
  route: string;
}

export const REPORT_CATALOG: ReportCatalogEntry[] = [
  {
    id: 'report-loan-portfolio',
    title: 'Loan Portfolio Report',
    generatedAt: '2026-06-08T08:00:00.000Z',
    category: 'portfolio',
    description: 'Active loans, outstanding balances, and portfolio health.',
    recordCount: 2714,
    route: '/reports/loan-portfolio',
  },
  {
    id: 'report-daily-collection',
    title: 'Daily Collection Report',
    generatedAt: '2026-06-09T06:00:00.000Z',
    category: 'collection',
    description: 'Expected vs collected repayments by borrower and collector.',
    recordCount: 186,
    route: '/reports/daily-collection',
  },
  {
    id: 'report-defaulters',
    title: 'Defaulter Report',
    generatedAt: '2026-06-08T12:00:00.000Z',
    category: 'risk',
    description: 'Borrowers with consecutive missed payments and arrears.',
    recordCount: 47,
    route: '/reports/defaulters',
  },
  {
    id: 'report-collector-performance',
    title: 'Collector Performance Report',
    generatedAt: '2026-06-07T18:00:00.000Z',
    category: 'operations',
    description: 'Collection rates, streaks, and field performance by collector.',
    recordCount: 34,
    route: '/reports/collector-performance',
  },
  {
    id: 'report-group-risk',
    title: 'Group Risk Report',
    generatedAt: '2026-06-08T09:30:00.000Z',
    category: 'risk',
    description: 'Group exposure, missed payments, and risk distribution.',
    recordCount: 128,
    route: '/reports/group-risk',
  },
  {
    id: 'report-financial-ledger',
    title: 'Financial Ledger Report',
    generatedAt: '2026-06-09T07:15:00.000Z',
    category: 'compliance',
    description: 'Immutable transaction ledger for disbursements and repayments.',
    recordCount: 8420,
    route: '/reports/financial-ledger',
  },
  {
    id: 'report-audit-log',
    title: 'Audit Log Report',
    generatedAt: '2026-06-09T08:00:00.000Z',
    category: 'compliance',
    description: 'Staff actions, approvals, and compliance audit trail.',
    recordCount: 1294,
    route: '/reports/audit-log',
  },
  {
    id: 'report-overpayment-review',
    title: 'Overpayment Review Report',
    generatedAt: '2026-06-06T16:00:00.000Z',
    category: 'operations',
    description: 'Pending and resolved overpayment review queue.',
    recordCount: 12,
    route: '/adjustments',
  },
  {
    id: 'report-disbursement-summary',
    title: 'Disbursement Summary Report',
    generatedAt: '2026-06-05T11:00:00.000Z',
    category: 'portfolio',
    description: 'Cycle disbursements, approvals, and payout totals.',
    recordCount: 318,
    route: '/loans',
  },
];
