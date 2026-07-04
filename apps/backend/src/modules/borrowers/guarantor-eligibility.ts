import type { BorrowerRecord } from '../../db/persistence.js';

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
}

export function evaluateGuarantorEligibility(
  input: GuarantorEligibilityInput,
  borrowers: BorrowerRecord[],
): GuarantorEligibilityResult {
  const normalizedPhone = input.guarantorPhone.trim();
  const normalizedName = input.guarantorName.trim().toLowerCase();
  const borrowerPhone = input.borrowerPhone?.trim();

  if (borrowerPhone && normalizedPhone === borrowerPhone) {
    return {
      isEligible: false,
      activeGuaranteeCount: 0,
      maxGuarantees: MAX_GUARANTOR_GUARANTEES,
      isDuplicateRegistration: false,
      validationStatus: 'INVALID',
      message: 'Guarantor phone must differ from borrower phone.',
    };
  }

  const activeGuaranteeCount = borrowers.filter(
    (record) => record.profile?.guarantorPhone === normalizedPhone,
  ).length;

  const isDuplicateRegistration = borrowers.some((record) => {
    const profile = record.profile;
    return (
      profile?.guarantorPhone === normalizedPhone &&
      profile?.guarantorName?.trim().toLowerCase() === normalizedName
    );
  });

  const isExempt = Boolean(input.isGroupLeader || input.isApprovedCommunityLeader);
  const maxGuarantees = isExempt ? MAX_GUARANTOR_GUARANTEES + 2 : MAX_GUARANTOR_GUARANTEES;

  if (isDuplicateRegistration) {
    return {
      isEligible: false,
      activeGuaranteeCount,
      maxGuarantees,
      isDuplicateRegistration: true,
      validationStatus: GUARANTOR_VALIDATION_STATUS.DUPLICATE,
      message: 'This guarantor profile is already linked to an active registration.',
    };
  }

  if (isExempt) {
    return {
      isEligible: true,
      activeGuaranteeCount,
      maxGuarantees,
      isDuplicateRegistration: false,
      validationStatus: GUARANTOR_VALIDATION_STATUS.EXEMPT,
      message: 'Group or community leader exemption applied.',
    };
  }

  if (activeGuaranteeCount >= MAX_GUARANTOR_GUARANTEES) {
    return {
      isEligible: false,
      activeGuaranteeCount,
      maxGuarantees: MAX_GUARANTOR_GUARANTEES,
      isDuplicateRegistration: false,
      validationStatus: GUARANTOR_VALIDATION_STATUS.AT_LIMIT,
      message: `Guarantor has reached the maximum of ${MAX_GUARANTOR_GUARANTEES} active guarantees.`,
    };
  }

  return {
    isEligible: true,
    activeGuaranteeCount,
    maxGuarantees: MAX_GUARANTOR_GUARANTEES,
    isDuplicateRegistration: false,
    validationStatus: GUARANTOR_VALIDATION_STATUS.VALID,
    message: `Current Guarantees: ${activeGuaranteeCount} of ${MAX_GUARANTOR_GUARANTEES}`,
  };
}
