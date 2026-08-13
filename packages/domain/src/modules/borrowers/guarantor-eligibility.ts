import type { BorrowerRecord } from '../../db/persistence.js';
import { BORROWER_STATUS } from '../../db/persistence.js';
import { scoreGuarantorEligibility } from '../../domain/guarantor/scoring.js';
import { normalizeGhanaPhone } from '../../infrastructure/sms/normalize-phone.js';

export const MAX_GUARANTOR_GUARANTEES = 3;

/** Statuses that occupy a guarantor slot. Rejected and blacklisted do not. */
export const ACTIVE_GUARANTEE_STATUSES = new Set<string>([
  BORROWER_STATUS.PENDING,
  BORROWER_STATUS.APPROVED,
  BORROWER_STATUS.AT_RISK,
  BORROWER_STATUS.DEFAULTED,
]);

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
  borrowerIdNumber?: string;
  excludeBorrowerId?: string;
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

function phonesMatch(left?: string | null, right?: string | null): boolean {
  if (!left?.trim() || !right?.trim()) {
    return false;
  }
  return normalizeGhanaPhone(left) === normalizeGhanaPhone(right);
}

function idsMatch(left?: string | null, right?: string | null): boolean {
  if (!left?.trim() || !right?.trim()) {
    return false;
  }
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function isSameBorrower(
  record: BorrowerRecord,
  input: GuarantorEligibilityInput,
): boolean {
  if (input.excludeBorrowerId && record.id === input.excludeBorrowerId) {
    return true;
  }
  if (phonesMatch(record.phone, input.borrowerPhone)) {
    return true;
  }
  return idsMatch(record.idNumber, input.borrowerIdNumber);
}

function isSameGuarantor(record: BorrowerRecord, input: GuarantorEligibilityInput): boolean {
  return phonesMatch(record.profile?.guarantorPhone, input.guarantorPhone);
}

function isActiveGuarantee(record: BorrowerRecord): boolean {
  return ACTIVE_GUARANTEE_STATUSES.has(record.status);
}

function buildScoringMetrics(
  normalizedPhone: string,
  borrowers: BorrowerRecord[],
  maxGuarantees: number,
  activeGuaranteeCount: number,
) {
  const borrowerDefaultCount = borrowers.filter(
    (record) =>
      record.status === BORROWER_STATUS.DEFAULTED &&
      phonesMatch(record.profile?.guarantorPhone, normalizedPhone),
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
  const borrowerPhone = input.borrowerPhone?.trim();

  if (borrowerPhone && phonesMatch(normalizedPhone, borrowerPhone)) {
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

  const linkedActive = borrowers.filter(
    (record) => isActiveGuarantee(record) && isSameGuarantor(record, input),
  );

  const duplicateForSameBorrower = linkedActive.some((record) => isSameBorrower(record, input));

  const otherActiveGuarantees = linkedActive.filter((record) => !isSameBorrower(record, input));
  const activeGuaranteeCount = otherActiveGuarantees.length;

  const isExempt = Boolean(input.isGroupLeader || input.isApprovedCommunityLeader);
  const maxGuarantees = isExempt ? MAX_GUARANTOR_GUARANTEES + 2 : MAX_GUARANTOR_GUARANTEES;

  if (duplicateForSameBorrower) {
    return withScore(
      {
        isEligible: false,
        activeGuaranteeCount,
        maxGuarantees,
        isDuplicateRegistration: true,
        validationStatus: GUARANTOR_VALIDATION_STATUS.DUPLICATE,
        message:
          'This guarantor is already linked to an active registration for the same borrower.',
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
        message: `Current Guarantees: ${activeGuaranteeCount} of ${maxGuarantees} (leader exemption applied).`,
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
