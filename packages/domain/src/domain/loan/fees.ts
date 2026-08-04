export const LOAN_FEE_TYPE = {
  PROCESSING: 'PROCESSING',
  ADMINISTRATION: 'ADMINISTRATION',
  LATE: 'LATE',
  INSURANCE: 'INSURANCE',
  DOCUMENTATION: 'DOCUMENTATION',
  CUSTOM: 'CUSTOM',
} as const;

export type LoanFeeType = (typeof LOAN_FEE_TYPE)[keyof typeof LOAN_FEE_TYPE];

export interface LoanFeeChargeInput {
  loanId: string;
  feeType: LoanFeeType;
  amountPesewas: number;
  exempted?: boolean;
  description?: string;
  createdByUserId?: string;
}

export function calculateFeeTotalPesewas(
  charges: Array<{ amountPesewas: number; exempted?: boolean }>,
): number {
  return charges.reduce((total, charge) => {
    if (charge.exempted) {
      return total;
    }
    return total + charge.amountPesewas;
  }, 0);
}
