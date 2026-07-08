import {
  GUARANTOR_VALIDATION_STATUS,
  MAX_GUARANTOR_GUARANTEES,
  type GuarantorEligibilityInput,
  type GuarantorEligibilityResult,
} from '@/types/guarantor-eligibility';
import type { BorrowerRegistryEntry } from '@/mocks/borrower-registry';
import { getBorrowerRegistryEntries } from '@/services/mock/borrower-registry.store';

function scoreFromMetrics(activeGuaranteeCount: number, maxGuarantees: number): {
  eligibilityScore: number;
  riskRating: 'LOW' | 'MEDIUM' | 'HIGH';
  scoreFactors: string[];
} {
  const utilization = activeGuaranteeCount / Math.max(maxGuarantees, 1);
  const factors: string[] = [];
  let score = 100;

  if (utilization >= 1) {
    score -= 40;
    factors.push('Maximum active guarantees reached');
  } else if (utilization >= 0.66) {
    score -= 20;
    factors.push('High guarantee utilization');
  }

  const eligibilityScore = Math.max(0, Math.min(100, score));
  const riskRating =
    eligibilityScore >= 75 ? 'LOW' : eligibilityScore >= 50 ? 'MEDIUM' : 'HIGH';

  return { eligibilityScore, riskRating, scoreFactors: factors };
}

export function checkGuarantorEligibility(
  input: GuarantorEligibilityInput,
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
      validationStatus: GUARANTOR_VALIDATION_STATUS.VALID,
      message: 'Guarantor phone must differ from borrower phone.',
      ...scoreFromMetrics(0, MAX_GUARANTOR_GUARANTEES),
    };
  }

  const activeGuaranteeCount = getBorrowerRegistryEntries().filter(
    (entry: BorrowerRegistryEntry) => entry.profile.guarantorPhone === normalizedPhone,
  ).length;

  const duplicateRegistration = getBorrowerRegistryEntries().some((entry: BorrowerRegistryEntry) => {
    const profile = entry.profile;
    return (
      profile.guarantorPhone === normalizedPhone &&
      profile.guarantorName.trim().toLowerCase() === normalizedName
    );
  });

  const isExempt = Boolean(input.isGroupLeader || input.isApprovedCommunityLeader);
  const maxGuarantees = isExempt ? MAX_GUARANTOR_GUARANTEES + 2 : MAX_GUARANTOR_GUARANTEES;
  const score = scoreFromMetrics(activeGuaranteeCount, maxGuarantees);

  if (duplicateRegistration) {
    return {
      isEligible: false,
      activeGuaranteeCount,
      maxGuarantees,
      isDuplicateRegistration: true,
      validationStatus: GUARANTOR_VALIDATION_STATUS.DUPLICATE,
      message: 'This guarantor profile is already linked to an active registration.',
      ...score,
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
      ...score,
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
      ...score,
    };
  }

  return {
    isEligible: true,
    activeGuaranteeCount,
    maxGuarantees: MAX_GUARANTOR_GUARANTEES,
    isDuplicateRegistration: false,
    validationStatus: GUARANTOR_VALIDATION_STATUS.VALID,
    message: `Current Guarantees: ${activeGuaranteeCount} of ${MAX_GUARANTOR_GUARANTEES}`,
    ...score,
  };
}
