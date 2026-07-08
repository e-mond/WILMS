export type PenaltyCalculation = 'FLAT' | 'PERCENTAGE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface PenaltyRule {
  calculation: PenaltyCalculation;
  amountPesewas?: number;
  percentage?: number;
  frequency?: PenaltyCalculation;
  maxAmountPesewas?: number;
}

export interface PenaltyAccrualInput {
  missedWeeks: number;
  installmentPesewas: number;
  rule: PenaltyRule;
}

export function calculatePenaltyPesewas(input: PenaltyAccrualInput): number {
  const { missedWeeks, installmentPesewas, rule } = input;
  if (missedWeeks <= 0) {
    return 0;
  }

  let penalty = 0;

  switch (rule.calculation) {
    case 'FLAT':
      penalty = (rule.amountPesewas ?? 0) * missedWeeks;
      break;
    case 'PERCENTAGE':
      penalty = Math.round(
        installmentPesewas * missedWeeks * ((rule.percentage ?? 0) / 100),
      );
      break;
    case 'DAILY':
      penalty = (rule.amountPesewas ?? 0) * missedWeeks * 7;
      break;
    case 'WEEKLY':
      penalty = (rule.amountPesewas ?? 0) * missedWeeks;
      break;
    case 'MONTHLY':
      penalty = (rule.amountPesewas ?? 0) * Math.ceil(missedWeeks / 4);
      break;
    default:
      penalty = 0;
  }

  if (rule.maxAmountPesewas !== undefined) {
    return Math.min(penalty, rule.maxAmountPesewas);
  }

  return penalty;
}

export function waivePenaltyAmount(currentPenaltyPesewas: number, waiverPesewas: number): number {
  return Math.max(0, currentPenaltyPesewas - waiverPesewas);
}
