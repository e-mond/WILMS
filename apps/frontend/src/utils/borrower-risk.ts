import type { BorrowerRiskSummary } from '@/types/borrower';

export const DEFAULT_BORROWER_RISK: BorrowerRiskSummary = {
  riskRating: 'Low Risk',
  missedPaymentCount: 0,
  defaultStatus: 'No',
  blacklistStatus: 'Clear',
  flags: [],
  notes: [],
};

export function resolveBorrowerRisk(risk?: BorrowerRiskSummary | null): BorrowerRiskSummary {
  return risk ?? DEFAULT_BORROWER_RISK;
}
