import { BORROWER_STATUS } from '@wilms/shared-contracts';
import { sql } from 'drizzle-orm';
import { countBorrowers, listPayments } from '../../db/persistence.js';
import { isDatabaseEnabled, getDb } from '../../db/client.js';
import { isUndefinedTableError } from '../../lib/db-errors.js';
import { decimalToPesewas } from '../../domain/money.js';
import * as loanRepo from '../../repositories/loan.repository.js';
import { listLoanPools } from '../loan-pools/service.js';
import { getExpenseSummary } from '../expenses/service.js';
import { getSettings } from '../settings/service.js';

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

async function computeLoanPortfolioTotals(): Promise<{
  totalDisbursedPesewas: number;
  totalOutstandingPesewas: number;
}> {
  const loans = await loanRepo.listLoans();
  let totalDisbursedPesewas = 0;
  let totalOutstandingPesewas = 0;

  for (const loan of loans) {
    const disbursedPesewas = decimalToPesewas(loan.disbursedAmount);
    const balancePesewas = decimalToPesewas(loan.loanBalance);
    const principalPesewas = decimalToPesewas(loan.principalAmount);

    if (loan.externalStatus !== 'PENDING_DISBURSEMENT') {
      totalDisbursedPesewas += disbursedPesewas > 0 ? disbursedPesewas : principalPesewas;
    }

    if (loan.externalStatus === 'ACTIVE' || loan.externalStatus === 'DEFAULTED') {
      totalOutstandingPesewas += balancePesewas;
    }
  }

  return { totalDisbursedPesewas, totalOutstandingPesewas };
}

export async function buildDashboardFinancialOverview(): Promise<DashboardFinancialOverview> {
  const payments = await listPayments();
  const totalCollectedPesewas = payments.reduce((sum, payment) => sum + payment.amountPesewas, 0);

  let poolSummary = {
    totalPoolFundsPesewas: 0,
    totalDisbursedPesewas: 0,
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

  const loanTotals = isDatabaseEnabled()
    ? await computeLoanPortfolioTotals()
    : { totalDisbursedPesewas: 0, totalOutstandingPesewas: 0 };

  poolSummary = {
    ...poolSummary,
    totalDisbursedPesewas: Math.max(poolSummary.totalDisbursedPesewas, loanTotals.totalDisbursedPesewas),
    totalOutstandingPesewas: Math.max(
      poolSummary.totalOutstandingPesewas,
      loanTotals.totalOutstandingPesewas,
    ),
  };

  const outstandingBalancePesewas = poolSummary.totalOutstandingPesewas;
  const expectedCollectionsPesewas = amountDueThisWeekPesewas;
  const collectionRatePercent =
    expectedCollectionsPesewas === 0
      ? totalCollectedPesewas > 0
        ? 100
        : 0
      : Math.min(100, Math.round((totalCollectedPesewas / expectedCollectionsPesewas) * 100));

  const settings = await getSettings();
  const approvedBorrowerCount = await countBorrowers(BORROWER_STATUS.APPROVED);
  const adminFeesCollectedPesewas = await sumAdminFeesCollected();
  const adminFeesExpectedPesewas = approvedBorrowerCount * settings.adminFeePesewas;
  const adminFeesOutstandingPesewas = Math.max(0, adminFeesExpectedPesewas - adminFeesCollectedPesewas);

  const expenseSummary = await getExpenseSummary();
  const totalExpensesPesewas = expenseSummary.yearPesewas;

  const moneyInCollections = totalCollectedPesewas;
  const moneyInAdminFees = adminFeesCollectedPesewas;
  const moneyInCapital = poolSummary.totalPoolFundsPesewas;
  const moneyInTotal = moneyInCollections + moneyInAdminFees + moneyInCapital;

  const moneyOutDisbursements = poolSummary.totalDisbursedPesewas;
  const moneyOutExpenses = totalExpensesPesewas;
  const moneyOutTotal = moneyOutDisbursements + moneyOutExpenses;

  return {
    capital: {
      totalCapitalAvailablePesewas: poolSummary.totalPoolFundsPesewas,
      totalCapitalInjectedPesewas: poolSummary.totalPoolFundsPesewas + poolSummary.totalDisbursedPesewas,
      currentAvailableBalancePesewas: Math.max(
        0,
        poolSummary.totalPoolFundsPesewas - poolSummary.totalDisbursedPesewas,
      ),
    },
    lending: {
      totalLoanAmountDisbursedPesewas: poolSummary.totalDisbursedPesewas,
      totalActiveLoans: activeLoans,
      totalClosedLoans: closedLoans,
    },
    collections: {
      totalAmountCollectedPesewas: totalCollectedPesewas,
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
    },
  };
}
