import { decimalToPesewas } from '../money.js';
import * as loanRepo from '../../repositories/loan.repository.js';

export interface LoanPortfolioTotals {
  totalDisbursedPesewas: number;
  totalOutstandingPesewas: number;
  totalCollectedPesewas: number;
}

export async function computeLoanPortfolioTotals(): Promise<LoanPortfolioTotals> {
  const loans = await loanRepo.listLoans();
  let totalDisbursedPesewas = 0;
  let totalOutstandingPesewas = 0;
  let totalCollectedPesewas = 0;

  for (const loan of loans) {
    const disbursedPesewas = decimalToPesewas(loan.disbursedAmount);
    const balancePesewas = decimalToPesewas(loan.loanBalance);
    const principalPesewas = decimalToPesewas(loan.principalAmount);

    if (loan.externalStatus !== 'PENDING_DISBURSEMENT') {
      const lentPesewas = disbursedPesewas > 0 ? disbursedPesewas : principalPesewas;
      totalDisbursedPesewas += lentPesewas;
      totalCollectedPesewas += Math.max(0, lentPesewas - balancePesewas);
    }

    if (loan.externalStatus === 'ACTIVE' || loan.externalStatus === 'DEFAULTED') {
      totalOutstandingPesewas += balancePesewas;
    }
  }

  return { totalDisbursedPesewas, totalOutstandingPesewas, totalCollectedPesewas };
}
