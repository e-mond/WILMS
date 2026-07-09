export const MAX_GUARANTOR_GUARANTEES = 3;

export const GUARANTOR_VALIDATION_STATUS = {
  VALID: 'VALID',
  AT_LIMIT: 'AT_LIMIT',
  DUPLICATE: 'DUPLICATE',
  EXEMPT: 'EXEMPT',
} as const;

export type GuarantorValidationStatus =
  (typeof GUARANTOR_VALIDATION_STATUS)[keyof typeof GUARANTOR_VALIDATION_STATUS];

export interface GuarantorEligibilityInput {
  guarantorPhone: string;
  guarantorIdNumber: string;
  guarantorName: string;
  borrowerPhone?: string;
  isGroupLeader?: boolean;
  isApprovedCommunityLeader?: boolean;
}

export interface GuarantorEligibilityResult {
  isEligible: boolean;
  activeGuaranteeCount: number;
  maxGuarantees: number;
  isDuplicateRegistration: boolean;
  validationStatus: GuarantorValidationStatus;
  message?: string;
  eligibilityScore: number;
  riskRating: 'LOW' | 'MEDIUM' | 'HIGH';
  scoreFactors: string[];
}
