import { BORROWER_STATUS } from '@wilms/shared-contracts';
import { sql } from 'drizzle-orm';
import { countBorrowers, listPayments } from '../../db/persistence.js';
import { isDatabaseEnabled, getDb } from '../../db/client.js';
import { isUndefinedTableError } from '../../lib/db-errors.js';
import { computeLoanPortfolioTotals } from '../../domain/loan-pool/portfolio-totals.js';
import { listLoanPools } from '../loan-pools/service.js';
import { getExpenseSummary } from '../expenses/service.js';
import { getSettings } from '../settings/service.js';
import * as loanRepo from '../../repositories/loan.repository.js';
import * as paymentRepo from '../../repositories/payment.repository.js';
import { decimalToPesewas } from '../../domain/money.js';

export interface DashboardFinancialOverview {
  capital: {
    totalCapitalAvailablePesewas: number;
    totalCapitalInjectedPesewas: number;
    currentAvailableBalancePesewas: number;
  };
  lending: {
    totalLoanAmountDisbursedPesewas: number;
    totalActiveLoans: number;
    totalClosedLoans: number;
  };
  collections: {
    totalAmountCollectedPesewas: number;
    netCollectionsAfterExpensesPesewas: number;
    outstandingBalancePesewas: number;
    amountDueThisWeekPesewas: number;
    overdueAmountPesewas: number;
    collectionRatePercent: number;
  };
  adminFees: {
    totalAdminFeesExpectedPesewas: number;
    totalAdminFeesCollectedPesewas: number;
    outstandingAdminFeesPesewas: number;
  };
  expenses: {
    totalExpensesPesewas: number;
    operationalCostsPesewas: number;
    cashOutflowPesewas: number;
  };
  cashFlow: {
    moneyIn: {
      loanCollectionsPesewas: number;
      adminFeesPesewas: number;
      capitalDepositsPesewas: number;
      otherIncomePesewas: number;
      totalPesewas: number;
    };
    moneyOut: {
      loanDisbursementsPesewas: number;
      operationalExpensesPesewas: number;
      refundsPesewas: number;
      adjustmentsPesewas: number;
      totalPesewas: number;
    };
    netPositionPesewas: number;
    netOperatingCashPesewas: number;
  };
  ledgerSource: {
    pools: 'loan_pools';
    collections: 'payments_confirmed_excluding_reversed';
    expenses: 'expenses_approved';
    adminFees: 'borrower_admin_fees';
    note: string;
  };
}

async function sumAdminFeesCollected(): Promise<number> {
  if (!isDatabaseEnabled()) {
    return 0;
  }

  try {
    const db = getDb();
    const result = await db.execute(sql`
      SELECT COALESCE(SUM(amount_pesewas), 0)::int AS total
      FROM borrower_admin_fees
    `);
    const row = result.rows[0] as { total?: number } | undefined;
    return Number(row?.total ?? 0);
  } catch (error) {
    if (isUndefinedTableError(error)) {
      return 0;
    }
    throw error;
  }
}

/**
 * Single source of truth for executive KPIs:
 * - Pool capital / outstanding / disbursed / collected come from loan_pools aggregates
 * - Collections exclude reversed payments
 * - Expenses reduce operating cash only (never loan principal or pool capital)
 * - Collection rate compares this-week due vs this-week confirmed collections
 */
export async function buildDashboardFinancialOverview(): Promise<DashboardFinancialOverview> {
  const today = new Date();
  const startOfWeek = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  startOfWeek.setUTCDate(startOfWeek.getUTCDate() - startOfWeek.getUTCDay());
  const weekStart = startOfWeek.toISOString().slice(0, 10);

  let totalCollectedPesewas = 0;
  let collectedThisWeekPesewas = 0;

  if (isDatabaseEnabled()) {
    // SQL aggregates — never truncate via listPayments 2000-row default.
    [totalCollectedPesewas, collectedThisWeekPesewas] = await Promise.all([
      paymentRepo.sumConfirmedPaymentsPesewas(),
      paymentRepo.sumConfirmedPaymentsSincePesewas(weekStart),
    ]);
  } else {
    const payments = await listPayments();
    totalCollectedPesewas = payments.reduce((sum, payment) => sum + payment.amountPesewas, 0);
    collectedThisWeekPesewas = payments
      .filter((payment) => payment.paymentDate >= weekStart)
      .reduce((sum, payment) => sum + payment.amountPesewas, 0);
  }

  let poolSummary = {
    totalPoolFundsPesewas: 0,
    totalDisbursedPesewas: 0,
    totalCollectedPesewas: 0,
    totalOutstandingPesewas: 0,
  };
  let activeLoans = 0;
  let closedLoans = 0;
  let amountDueThisWeekPesewas = 0;
  let overdueAmountPesewas = 0;

  if (isDatabaseEnabled()) {
    try {
      const pools = await listLoanPools();
      poolSummary = pools.summary;
    } catch {
      poolSummary = {
        totalPoolFundsPesewas: 0,
        totalDisbursedPesewas: 0,
        totalCollectedPesewas: 0,
        totalOutstandingPesewas: 0,
      };
    }

    const loans = await loanRepo.listLoans();
    for (const loan of loans) {
      if (loan.externalStatus === 'ACTIVE') {
        activeLoans += 1;
        amountDueThisWeekPesewas += decimalToPesewas(loan.installmentAmount);
      }

      if (
        loan.externalStatus === 'COMPLETED' ||
        loan.externalStatus === 'DEFAULTED' ||
        loan.externalStatus === 'WRITTEN_OFF'
      ) {
        closedLoans += 1;
      }

      if (loan.externalStatus === 'DEFAULTED') {
        overdueAmountPesewas += decimalToPesewas(loan.loanBalance);
      }
    }
  }

  // Prefer pool aggregates; fall back to loan portfolio only when pools are empty.
  const loanTotals = isDatabaseEnabled()
    ? await computeLoanPortfolioTotals()
    : { totalDisbursedPesewas: 0, totalCollectedPesewas: 0, totalOutstandingPesewas: 0 };

  const poolsHaveCapital = poolSummary.totalPoolFundsPesewas > 0 || poolSummary.totalDisbursedPesewas > 0;
  if (!poolsHaveCapital) {
    poolSummary = {
      ...poolSummary,
      totalDisbursedPesewas: loanTotals.totalDisbursedPesewas,
      totalCollectedPesewas: loanTotals.totalCollectedPesewas,
      totalOutstandingPesewas: loanTotals.totalOutstandingPesewas,
    };
  }

  // Prefer pool collected when present; otherwise confirmed payment SQL sum.
  const collectionsPesewas =
    poolSummary.totalCollectedPesewas > 0 ? poolSummary.totalCollectedPesewas : totalCollectedPesewas;

  const outstandingBalancePesewas = poolSummary.totalOutstandingPesewas;
  const collectionRatePercent =
    amountDueThisWeekPesewas === 0
      ? collectedThisWeekPesewas > 0
        ? 100
        : 0
      : Math.min(100, Math.round((collectedThisWeekPesewas / amountDueThisWeekPesewas) * 100));

  const settings = await getSettings();
  const approvedBorrowerCount = await countBorrowers(BORROWER_STATUS.APPROVED);
  const adminFeesCollectedPesewas = await sumAdminFeesCollected();
  const adminFeesExpectedPesewas = approvedBorrowerCount * settings.adminFeePesewas;
  const adminFeesOutstandingPesewas = Math.max(0, adminFeesExpectedPesewas - adminFeesCollectedPesewas);

  const expenseSummary = await getExpenseSummary();
  const totalExpensesPesewas = expenseSummary.yearPesewas;
  // Operating cash only — expenses never reduce loan principal or pool capital.
  const netOperatingCashPesewas =
    collectionsPesewas + adminFeesCollectedPesewas - totalExpensesPesewas;
  const netCollectionsAfterExpensesPesewas = Math.max(0, collectionsPesewas - totalExpensesPesewas);

  const moneyInCollections = collectionsPesewas;
  const moneyInAdminFees = adminFeesCollectedPesewas;
  const moneyInCapital = poolSummary.totalPoolFundsPesewas;
  const moneyInTotal = moneyInCollections + moneyInAdminFees + moneyInCapital;

  const moneyOutDisbursements = poolSummary.totalDisbursedPesewas;
  const moneyOutExpenses = totalExpensesPesewas;
  const moneyOutTotal = moneyOutDisbursements + moneyOutExpenses;

  return {
    capital: {
      totalCapitalAvailablePesewas: poolSummary.totalPoolFundsPesewas,
      // Capital injected = funded pool capital (not capital + disbursed double-count).
      totalCapitalInjectedPesewas: poolSummary.totalPoolFundsPesewas,
      currentAvailableBalancePesewas: Math.max(
        0,
        poolSummary.totalPoolFundsPesewas - poolSummary.totalOutstandingPesewas,
      ),
    },
    lending: {
      totalLoanAmountDisbursedPesewas: poolSummary.totalDisbursedPesewas,
      totalActiveLoans: activeLoans,
      totalClosedLoans: closedLoans,
    },
    collections: {
      totalAmountCollectedPesewas: collectionsPesewas,
      netCollectionsAfterExpensesPesewas,
      outstandingBalancePesewas,
      amountDueThisWeekPesewas,
      overdueAmountPesewas,
      collectionRatePercent,
    },
    adminFees: {
      totalAdminFeesExpectedPesewas: adminFeesExpectedPesewas,
      totalAdminFeesCollectedPesewas: adminFeesCollectedPesewas,
      outstandingAdminFeesPesewas: adminFeesOutstandingPesewas,
    },
    expenses: {
      totalExpensesPesewas: totalExpensesPesewas,
      operationalCostsPesewas: expenseSummary.monthPesewas,
      cashOutflowPesewas: expenseSummary.weekPesewas,
    },
    cashFlow: {
      moneyIn: {
        loanCollectionsPesewas: moneyInCollections,
        adminFeesPesewas: moneyInAdminFees,
        capitalDepositsPesewas: moneyInCapital,
        otherIncomePesewas: 0,
        totalPesewas: moneyInTotal,
      },
      moneyOut: {
        loanDisbursementsPesewas: moneyOutDisbursements,
        operationalExpensesPesewas: moneyOutExpenses,
        refundsPesewas: 0,
        adjustmentsPesewas: 0,
        totalPesewas: moneyOutTotal,
      },
      netPositionPesewas: moneyInTotal - moneyOutTotal,
      netOperatingCashPesewas,
    },
    ledgerSource: {
      pools: 'loan_pools',
      collections: 'payments_confirmed_excluding_reversed',
      expenses: 'expenses_approved',
      adminFees: 'borrower_admin_fees',
      note: 'Expenses reduce netOperatingCash only; pool capital and loan principal are unaffected.',
    },
  };
}
