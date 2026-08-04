import type { BorrowerRecord } from '../../db/persistence.js';
import { BORROWER_STATUS } from '../../db/persistence.js';
import { scoreGuarantorEligibility } from '../../domain/guarantor/scoring.js';

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
  guarantorIdNumber?: string;
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
  validationStatus: GuarantorValidationStatus | 'INVALID';
  message?: string;
  eligibilityScore: number;
  riskRating: 'LOW' | 'MEDIUM' | 'HIGH';
  scoreFactors: string[];
}

function buildScoringMetrics(
  normalizedPhone: string,
  borrowers: BorrowerRecord[],
  maxGuarantees: number,
  activeGuaranteeCount: number,
) {
  const activeGuaranteeStatuses = new Set<string>([
    BORROWER_STATUS.APPROVED,
    BORROWER_STATUS.AT_RISK,
    BORROWER_STATUS.DEFAULTED,
  ]);

  const borrowerDefaultCount = borrowers.filter(
    (record) =>
      record.status === BORROWER_STATUS.DEFAULTED &&
      activeGuaranteeStatuses.has(record.status) &&
      record.profile?.guarantorPhone === normalizedPhone,
  ).length;

  return scoreGuarantorEligibility({
    activeGuaranteeCount,
    maxGuarantees,
    borrowerDefaultCount,
    outstandingGuaranteePesewas: 0,
    onTimeRepaymentRate: borrowerDefaultCount > 0 ? 0.5 : 1,
  });
}

function withScore(
  result: Omit<GuarantorEligibilityResult, 'eligibilityScore' | 'riskRating' | 'scoreFactors'>,
  normalizedPhone: string,
  borrowers: BorrowerRecord[],
): GuarantorEligibilityResult {
  const score = buildScoringMetrics(
    normalizedPhone,
    borrowers,
    result.maxGuarantees,
    result.activeGuaranteeCount,
  );

  return {
    ...result,
    eligibilityScore: score.eligibilityScore,
    riskRating: score.riskRating,
    scoreFactors: score.factors,
  };
}

export function evaluateGuarantorEligibility(
  input: GuarantorEligibilityInput,
  borrowers: BorrowerRecord[],
): GuarantorEligibilityResult {
  const normalizedPhone = input.guarantorPhone.trim();
  const normalizedName = input.guarantorName.trim().toLowerCase();
  const borrowerPhone = input.borrowerPhone?.trim();

  if (borrowerPhone && normalizedPhone === borrowerPhone) {
    return withScore(
      {
        isEligible: false,
        activeGuaranteeCount: 0,
        maxGuarantees: MAX_GUARANTOR_GUARANTEES,
        isDuplicateRegistration: false,
        validationStatus: 'INVALID',
        message: 'Guarantor phone must differ from borrower phone.',
      },
      normalizedPhone,
      borrowers,
    );
  }

  const activeGuaranteeStatuses = new Set<string>([
    BORROWER_STATUS.APPROVED,
    BORROWER_STATUS.AT_RISK,
    BORROWER_STATUS.DEFAULTED,
  ]);

  const activeGuaranteeCount = borrowers.filter(
    (record) =>
      activeGuaranteeStatuses.has(record.status) &&
      record.profile?.guarantorPhone === normalizedPhone,
  ).length;

  const isDuplicateRegistration = borrowers.some((record) => {
    if (record.status !== BORROWER_STATUS.APPROVED) {
      return false;
    }

    const profile = record.profile;
    return (
      profile?.guarantorPhone === normalizedPhone &&
      profile?.guarantorName?.trim().toLowerCase() === normalizedName
    );
  });

  const isExempt = Boolean(input.isGroupLeader || input.isApprovedCommunityLeader);
  const maxGuarantees = isExempt ? MAX_GUARANTOR_GUARANTEES + 2 : MAX_GUARANTOR_GUARANTEES;

  if (isDuplicateRegistration) {
    return withScore(
      {
        isEligible: false,
        activeGuaranteeCount,
        maxGuarantees,
        isDuplicateRegistration: true,
        validationStatus: GUARANTOR_VALIDATION_STATUS.DUPLICATE,
        message: 'This guarantor profile is already linked to an active registration.',
      },
      normalizedPhone,
      borrowers,
    );
  }

  if (isExempt) {
    return withScore(
      {
        isEligible: true,
        activeGuaranteeCount,
        maxGuarantees,
        isDuplicateRegistration: false,
        validationStatus: GUARANTOR_VALIDATION_STATUS.EXEMPT,
        message: 'Group or community leader exemption applied.',
      },
      normalizedPhone,
      borrowers,
    );
  }

  if (activeGuaranteeCount >= MAX_GUARANTOR_GUARANTEES) {
    return withScore(
      {
        isEligible: false,
        activeGuaranteeCount,
        maxGuarantees: MAX_GUARANTOR_GUARANTEES,
        isDuplicateRegistration: false,
        validationStatus: GUARANTOR_VALIDATION_STATUS.AT_LIMIT,
        message: `Guarantor has reached the maximum of ${MAX_GUARANTOR_GUARANTEES} active guarantees.`,
      },
      normalizedPhone,
      borrowers,
    );
  }

  return withScore(
    {
      isEligible: true,
      activeGuaranteeCount,
      maxGuarantees: MAX_GUARANTOR_GUARANTEES,
      isDuplicateRegistration: false,
      validationStatus: GUARANTOR_VALIDATION_STATUS.VALID,
      message: `Current Guarantees: ${activeGuaranteeCount} of ${MAX_GUARANTOR_GUARANTEES}`,
    },
    normalizedPhone,
    borrowers,
  );
}
