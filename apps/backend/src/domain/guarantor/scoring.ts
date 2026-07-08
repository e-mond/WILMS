export interface GuarantorScoringInput {
  activeGuaranteeCount: number;
  maxGuarantees: number;
  borrowerDefaultCount: number;
  outstandingGuaranteePesewas: number;
  onTimeRepaymentRate: number;
}

export interface GuarantorScore {
  eligibilityScore: number;
  riskRating: 'LOW' | 'MEDIUM' | 'HIGH';
  factors: string[];
}

export function scoreGuarantorEligibility(input: GuarantorScoringInput): GuarantorScore {
  const factors: string[] = [];
  let score = 100;

  const utilization = input.activeGuaranteeCount / Math.max(input.maxGuarantees, 1);
  if (utilization >= 1) {
    score -= 40;
    factors.push('Maximum active guarantees reached');
  } else if (utilization >= 0.66) {
    score -= 20;
    factors.push('High guarantee utilization');
  }

  if (input.borrowerDefaultCount > 0) {
    score -= Math.min(30, input.borrowerDefaultCount * 10);
    factors.push('Prior borrower defaults on record');
  }

  if (input.outstandingGuaranteePesewas > 0) {
    score -= 10;
    factors.push('Outstanding guarantee exposure');
  }

  if (input.onTimeRepaymentRate < 0.7) {
    score -= 15;
    factors.push('Low on-time repayment rate');
  }

  const eligibilityScore = Math.max(0, Math.min(100, score));
  const riskRating =
    eligibilityScore >= 75 ? 'LOW' : eligibilityScore >= 50 ? 'MEDIUM' : 'HIGH';

  return { eligibilityScore, riskRating, factors };
}
